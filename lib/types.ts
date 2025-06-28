export type DataPart = { type: 'append-message'; message: string };

// Artifact types - simplified for external server integration
export type ArtifactKind = 'text' | 'code' | 'image' | 'sheet';

export interface UIArtifact {
  id: string;
  documentId: string;
  title: string;
  content: string;
  kind: ArtifactKind;
  status: 'idle' | 'streaming' | 'complete';
  isVisible: boolean;
}
