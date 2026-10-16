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
import { ScriptedSchedulingAgent } from "./mock/scripted-scheduling";
import { ScriptedTranscriptionProvider } from "./mock/scripted-transcription";
import type {
  ChatProvider,
  PatientDataSource,
  RecordInterpreter,
  SchedulingAgent,
  TranscriptionProvider,
  VisitSummarizer,
} from "./types";

export interface Services {
  patientData: PatientDataSource;
  transcription: TranscriptionProvider;
  summarizer: VisitSummarizer;
  recordInterpreter: RecordInterpreter;
  chat: ChatProvider;
  scheduling: SchedulingAgent;
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
  scheduling: new ScriptedSchedulingAgent({
    pace: () => (useDemoStore.getState().replaySpeed === "fast" ? 0.25 : 1),
  }),
};

export type * from "./types";
