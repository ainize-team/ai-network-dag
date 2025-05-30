import { EventEmitter } from 'events';

export interface AddContent {
  cid?: string;
  message?: string;
  data?: Buffer | Uint8Array;
  children?: string[];
}

export interface AddResult {
  cid: string;
}

export interface PublishResult {
  success: boolean;
}

declare class AINetworkDAGClient extends EventEmitter {
  constructor(serverAddress: string, credentials?: any);

  add(content: AddContent): Promise<AddResult>;
  get(cid: string): Promise<any>;
  publish(topic: string, instruction: string): Promise<PublishResult>;
  subscribe(topic: string, nodePk: string): string | null;
  unsubscribe(subscriptionId: string): boolean;
  addFile(filePath: string, message?: string, children?: string[]): Promise<AddResult>;
  close(): void;
}

export default AINetworkDAGClient;