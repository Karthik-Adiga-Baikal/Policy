"use client";

import { createContext, useContext, useMemo, useReducer, type Dispatch, type ReactNode } from "react";

type MenuName = "File" | "Edit" | "View" | "Insert" | "Format" | "Tools" | "Help" | null;

export interface DocumentEditorState {
  title: string;
  properties: {
    product: string;
    version: string;
    status: string;
  };
  ui: {
    activeMenu: MenuName;
    showRuler: boolean;
    showFormattingMarks: boolean;
    darkMode: boolean;
    zoom: number;
  };
  editor: {
    wordCount: number;
    charCount: number;
    lineCount: number;
    cursorLine: number;
    cursorColumn: number;
    lastSavedAt: string | null;
    recoveryUsed: boolean;
  };
}

type Action =
  | { type: "set_title"; payload: string }
  | { type: "set_properties"; payload: Partial<DocumentEditorState["properties"]> }
  | { type: "set_ui"; payload: Partial<DocumentEditorState["ui"]> }
  | { type: "set_editor_stats"; payload: Partial<DocumentEditorState["editor"]> };

function reducer(state: DocumentEditorState, action: Action): DocumentEditorState {
  switch (action.type) {
    case "set_title":
      return { ...state, title: action.payload };
    case "set_properties":
      return { ...state, properties: { ...state.properties, ...action.payload } };
    case "set_ui":
      return { ...state, ui: { ...state.ui, ...action.payload } };
    case "set_editor_stats":
      return { ...state, editor: { ...state.editor, ...action.payload } };
    default:
      return state;
  }
}

interface DocumentEditorContextValue {
  state: DocumentEditorState;
  dispatch: Dispatch<Action>;
}

const DocumentEditorContext = createContext<DocumentEditorContextValue | null>(null);

interface ProviderProps {
  children: ReactNode;
  initialState: DocumentEditorState;
}

export function DocumentEditorProvider({ children, initialState }: ProviderProps) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <DocumentEditorContext.Provider value={value}>{children}</DocumentEditorContext.Provider>;
}

export function useDocumentEditor() {
  const context = useContext(DocumentEditorContext);
  if (!context) {
    throw new Error("useDocumentEditor must be used inside DocumentEditorProvider");
  }
  return context;
}
