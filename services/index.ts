/**
 * The one place service implementations are chosen.
 * Swapping a mock for a real engine means changing a line here, not touching screens.
 */
import { REPLAY_FACTOR, useDemoStore } from "@/lib/store";
import { FixturePatientDataSource } from "./mock/fixture-patient-data";
import { FixtureRecordInterpreter } from "./mock/fixture-record-interpreter";
import { FixtureVisitSummarizer } from "./mock/fixture-summarizer";
import { transcriptFixtureFor } from "./mock/fixture-transcripts";
import { ScriptedChatProvider } from "./mock/scripted-chat";
import { ScriptedTranscriptionProvider } from "./mock/scripted-transcription";
import type {
  ChatProvider,
  PatientDataSource,
  RecordInterpreter,
  TranscriptionProvider,
  VisitSummarizer,
} from "./types";

export interface Services {
  patientData: PatientDataSource;
  transcription: TranscriptionProvider;
  summarizer: VisitSummarizer;
  recordInterpreter: RecordInterpreter;
  chat: ChatProvider;
}

export const services: Services = {
  patientData: new FixturePatientDataSource(),
  transcription: new ScriptedTranscriptionProvider({
    fixtureFor: transcriptFixtureFor,
    getSpeed: () => REPLAY_FACTOR[useDemoStore.getState().replaySpeed],
  }),
  summarizer: new FixtureVisitSummarizer(),
  recordInterpreter: new FixtureRecordInterpreter(),
  chat: new ScriptedChatProvider(),
};

export type * from "./types";
