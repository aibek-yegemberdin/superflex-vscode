import * as vscode from "vscode";

import { ChatAPI } from "./ChatApi";
import { Logger } from "../utils/logger";
import { createWebviewTemplate } from "../webview/webviewTemplates";

interface RequestMessage {
  id: string;
  command: string;
  data: any;
}

export default class ChatViewProvider implements vscode.WebviewViewProvider {
  private chatWebviewView?: vscode.WebviewView;

  private chatWebview?: vscode.Webview;

  private extensionUri: vscode.Uri;

  constructor(
    private context: vscode.ExtensionContext,
    private chatApi: ChatAPI
  ) {
    this.extensionUri = context.extensionUri;
  }

  private init() {
    if (!this.chatWebview) {
      return;
    }

    this.chatWebview.onDidReceiveMessage(
      async (message: RequestMessage) => {
        try {
          const payload = await this.chatApi.handleEvent(
            message.command,
            message.data
          );
          void this.chatWebview?.postMessage({
            id: message.id,
            payload,
          });
        } catch (e) {
          Logger.error(`failed to handle event. message: ${message.data}`);
          void this.chatWebview?.postMessage({
            id: message.id,
            error: (e as Error).message,
          });
        }
      },
      undefined,
      this.context.subscriptions
    );
  }

  async handleMessageSubmitted(userInput: string) {
    await this.focusChatInput();

    setTimeout(() => {
      void this.chatWebview?.postMessage({
        command: "submit-message",
        data: {
          input: userInput,
        },
      });
    }, 500);
  }

  async focusChatInput() {
    void vscode.commands.executeCommand("workbench.view.extension.elementai");
    await this.waitForChatInitiated();
    void this.chatWebviewView?.show(true);
    void this.chatWebview?.postMessage({
      command: "focus-input",
    });
  }

  clearAllConversations() {
    void this.chatWebview?.postMessage({
      command: "clear-all-conversations",
    });
  }

  waitForChatInitiated(): Promise<unknown> {
    return this.chatApi.onReady;
  }

  resolveWebviewView(webviewView: vscode.WebviewView): void | Thenable<void> {
    const localWebviewView = webviewView;
    this.chatWebviewView = localWebviewView;
    this.chatWebview = localWebviewView.webview;
    localWebviewView.webview.options = {
      enableScripts: true,
      enableCommandUris: true,
    };

    this.init();

    return this.setWebviewHtml(localWebviewView);
  }

  setWebviewHtml(webviewView: vscode.WebviewView): void {
    let scriptSrc = webviewView.webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, "webview-ui", "dist", "index.js")
    );

    let cssSrc = webviewView.webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, "webview-ui", "dist", "index.css")
    );

    webviewView.webview.html = createWebviewTemplate(scriptSrc, cssSrc);
  }
}