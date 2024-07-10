import fs from "fs";
import OpenAI from "openai";
import { AssistantCreateParams } from "openai/src/resources/beta/assistants.js";

import { ElementAICache } from "../cache/ElementAICache";
import { ASSISTANT_DESCRIPTION, ASSISTANT_INSTRUCTIONS, ASSISTANT_NAME } from "./constants";
import { AIProvider, Assistant, FileObject, Message, MessageContent, TextDelta, VectorStore } from "./AIProvider";

const FILE_ID_MAP_NAME = "file-id-map.json";

class OpenAIVectorStore implements VectorStore {
  id: string;

  private _openai: OpenAI;

  constructor(id: string, openai: OpenAI) {
    this.id = id;
    this._openai = openai;
  }

  async fetchFiles(): Promise<FileObject[]> {
    // Implement in the way that you will save file ids mapped to file path in the cache folder
    throw new Error("Method not implemented.");
  }

  async uploadFiles(filePaths: string[]): Promise<void> {
    const cachedFilePathToIDMap = ElementAICache.get(FILE_ID_MAP_NAME);
    const filePathToIDMap: any = cachedFilePathToIDMap ? JSON.parse(cachedFilePathToIDMap) : {};

    for (const documentPath of ElementAICache.cacheFilesSync(filePaths)) {
      const fileStat = fs.statSync(documentPath.originalPath);

      let relativeFilepath = documentPath.cachedPath;
      if (ElementAICache.storagePath) {
        relativeFilepath = documentPath.cachedPath.replace(ElementAICache.storagePath, "");
      }

      const cachedFile = filePathToIDMap[relativeFilepath];

      // Skip uploading the file if it has not been modified since the last upload
      if (cachedFile && new Date(fileStat.mtime).getTime() <= new Date(cachedFile.createdAt).getTime()) {
        continue;
      }

      try {
        if (cachedFile) {
          await this._openai.files.del(cachedFile.fileID);
        }

        const file = await this._openai.files.create({
          file: fs.createReadStream(documentPath.cachedPath),
          purpose: "assistants",
        });

        await this._openai.beta.vectorStores.files.createAndPoll(this.id, { file_id: file.id });

        filePathToIDMap[relativeFilepath] = { fileID: file.id, createdAt: fileStat.mtime };
      } catch (err: any) {
        console.error(`Failed to upload file ${documentPath}: ${err?.message}`);
      }
    }

    ElementAICache.set(FILE_ID_MAP_NAME, JSON.stringify(filePathToIDMap));
    ElementAICache.removeCachedFilesSync();
  }

  async removeFiles(filePaths: string[]): Promise<void> {
    // Not supported: Files that are not used in the vector store will expire after 7 days
  }
}

class OpenAIAssistant implements Assistant {
  id: string;

  private _openai: OpenAI;

  constructor(id: string, openai: OpenAI) {
    this.id = id;
    this._openai = openai;
  }

  async sendMessage(message: MessageContent, streamResponse?: (event: TextDelta) => Promise<void>): Promise<Message> {
    throw new Error("Method not implemented.");
  }
}

export default class OpenAIProvider implements AIProvider {
  private _openai: OpenAI;

  constructor(openai: OpenAI) {
    this._openai = openai;
  }

  async retrieveVectorStore(id: string): Promise<VectorStore> {
    const vectorStore = await this._openai.beta.vectorStores.retrieve(id);

    return new OpenAIVectorStore(vectorStore.id, this._openai);
  }

  async createVectorStore(name: string): Promise<VectorStore> {
    const vectorStore = await this._openai.beta.vectorStores.create({
      name: `${name}-vector-store`,
      expires_after: {
        anchor: "last_active_at",
        days: 7,
      },
    });

    return new OpenAIVectorStore(vectorStore.id, this._openai);
  }

  async retrieveAssistant(id: string): Promise<Assistant> {
    const assistant = await this._openai.beta.assistants.retrieve(id);

    return new OpenAIAssistant(assistant.id, this._openai);
  }

  async createAssistant(vectorStore?: VectorStore): Promise<Assistant> {
    const createParams: AssistantCreateParams = {
      name: ASSISTANT_NAME,
      description: ASSISTANT_DESCRIPTION,
      instructions: ASSISTANT_INSTRUCTIONS,
      model: "gpt-4o",
      tools: [{ type: "file_search" }],
      temperature: 0.2,
    };

    if (vectorStore) {
      createParams.tool_resources = {
        file_search: {
          vector_store_ids: [vectorStore.id],
        },
      };
    }

    const assistant = await this._openai.beta.assistants.create(createParams);

    return new OpenAIAssistant(assistant.id, this._openai);
  }
}
