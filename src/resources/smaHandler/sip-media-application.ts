/* eslint-disable @typescript-eslint/indent */
/*eslint import/no-unresolved: 0 */

import { Callback, Handler } from 'aws-lambda';

export type SipMediaApplicationHandler = Handler<
  SipMediaApplicationEvent,
  SipMediaApplicationResponse
>;
export type SipMediaApplicationCallback = Callback<SipMediaApplicationResponse>;

export interface SipMediaApplicationResponse {
  SchemaVersion: SchemaVersion;
  Actions: Actions[] | undefined;
  TransactionAttributes?: { [key: string]: string };
}

export interface SipMediaApplicationEvent {
  SchemaVersion: string;
  Sequence: number;
  InvocationEventType: InvocationEventType;
  ActionData?: ActionData;
  CallDetails: CallDetails;
}

export enum SchemaVersion {
  VERSION_1_0 = '1.0',
}
export enum InvocationEventType {
  ACTION_SUCCESSFUL = 'ACTION_SUCCESSFUL',
  ACTION_FAILED = 'ACTION_FAILED',
  NEW_INBOUND_CALL = 'NEW_INBOUND_CALL',
  RINGING = 'RINGING',
  HANGUP = 'HANGUP',
  CALL_ANSWERED = 'CALL_ANSWERED',
  NEW_OUTBOUND_CALL = 'NEW_OUTBOUND_CALL',
  CALL_UPDATE_REQUESTED = 'CALL_UPDATE_REQUESTED',
}

export enum ActionTypes {
  CALL_AND_BRIDGE = 'CallAndBridge',
  HANGUP = 'Hangup',
  JOIN_CHIME_MEETING = 'JoinChimeMeeting',
  MODIFY_CHIME_MEETING_ATTENDEES = 'ModifyChimeMeetingAttendees',
  PAUSE = 'Pause',
  PLAY_AUDIO = 'PlayAudio',
  PLAY_AUDIO_AND_GET_DIGITS = 'PlayAudioAndGetDigits',
  RECEIVE_DIGITS = 'ReceiveDigits',
  RECORD_AUDIO = 'RecordAudio',
  SEND_DIGITS = 'SendDigits',
  SPEAK = 'Speak',
  SPEAK_AND_GET_DIGITS = 'SpeakAndGetDigits',
  START_BOT_CONVERSATION = 'StartBotConversation',
  VOICE_FOCUS = 'VoiceFocus',
  START_CALL_RECORDING = 'StartCallRecording',
  STOP_CALL_RECORDING = 'StopCallRecording',
  PAUSE_CALL_RECORDING = 'PauseCallRecording',
  RESUME_CALL_RECORDING = 'ResumeCallRecording',
}
export enum BridgeEndpointType {
  AWS = 'AWS',
  PSTN = 'PSTN',
}
export interface CallAndBridgeEndpoints {
  BridgeEndpointType: BridgeEndpointType;
  Uri: string;
  Arn?: string;
}

export interface AudioSource {
  Type: 'S3';
  BucketName: string;
  Key: string;
}

export interface CommonActionParameters {
  CallId?: string;
  ParticipantTag?: ParticipantTag;
}
export interface CallAndBridgeActionParameters {
  CallTimeoutSeconds: number;
  CallerIdNumber: string;
  RingbackTone?: AudioSource;
  Endpoints: CallAndBridgeEndpoints[];
  SipHeaders?: { [key: string]: string };
}

export interface HangupActionParameters {
  SipResponseCode: string;
}

export interface JoinChimeMeetingActionParameters {
  JoinToken: string;
  MeetingId: string;
}

export interface ModifyChimeMeetingAttendeesActionParameters {
  Operation: ModifyChimeMeetingAttendeesOperation;
  MeetingId: string;
  AttendeeList: Array<string>;
}

export interface PauseActionParameters {
  DurationInMilliseconds: number;
}

export interface PlayAudioActionParameters {
  PlaybackTerminators: Array<string>;
  Repeat: number;
  AudioSource: AudioSource;
}

export interface PlayAudioAndGetDigitsActionParameters {
  InputDigitsRegex: string;
  AudioSource: AudioSource;
  FailureAudioSource: AudioSource;
  MinNumberOfDigits: number;
  MaxNumberOfDigits: number;
  TerminatorDigits: Array<string>;
  InBetweenDigitsDurationInMilliseconds: number;
  Repeat: number;
  RepeatDurationInMilliseconds: number;
}

export interface ReceiveDigitsActionParameters {
  InputDigitRegex: string;
  InBetweenDigitsDurationInMilliseconds: number;
  FlushDigitsDurationInMilliseconds: number;
}

export interface RecordAudioActionParameters {
  DurationInSeconds: number;
  SilenceDurationInSeconds: number;
  SilenceThreshold: number;
  RecordingTerminators: Array<string>;
  RecordingDestination: RecordingDestination;
}

export interface SendDigitsActionParameters {
  Digits: string;
  ToneDurationInMilliseconds: number;
}

export interface SpeakActionParameters {
  Text: string;
  Engine: Engine;
  LanguageCode: PollyLanguageCodes;
  TextType: TextType;
  VoiceId: PollyVoiceIds;
}

export interface SpeakAndGetDigitsActionParameters {
  InputDigitsRegex: string;
  SpeechParameters: SpeechParameters;
  FailureSpeechParameters: SpeechParameters;
  MinNumberOfDigits: number;
  MaxNumberOfDigits: number;
  TerminatorDigits: Array<string>;
  InBetweenDigitsDurationInMilliseconds: number;
  Repeat: number;
  RepeatDurationInMilliseconds: number;
}

export interface StartBotConversaionActionParameters {
  BotAliasArn: string;
  LocalId: string;
  Configuration: StartBotConversationConfiguration;
}

export interface VoiceFocusActionParameters {
  Enable: boolean;
}

export interface StartBotConversationConfiguration {
  SessionState: SessionAttributes;
  WelcomeMessages: WelcomeMessages[];
}

export interface WelcomeMessages {
  Content: string;
  ContentType: ContentType;
}
export interface SessionAttributes {
  [key: string]: string;
}

export interface DialogAction {
  Type: DialogActionTypes;
}

export enum DialogActionTypes {
  DELEGATE = 'Delegate',
  ELICIT_INTENT = 'ElicitIntent',
}
export interface SpeechParameters {
  Text: string;
  Engine: Engine;
  LanguageCode: PollyLanguageCodes;
  TextType: TextType;
  VoiceId: PollyVoiceIds;
}

export enum PollyVoiceIds {
  'Aditi',
  'Amy',
  'Astrid',
  'Bianca',
  'Brian',
  'Camila',
  'Carla',
  'Carmen',
  'Celine',
  'Chantal',
  'Conchita',
  'Cristiano',
  'Dora',
  'Emma',
  'Enrique',
  'Ewa',
  'Filiz',
  'Gabrielle',
  'Geraint',
  'Giorgio',
  'Gwyneth',
  'Hans',
  'Ines',
  'Ivy',
  'Jacek',
  'Jan',
  'Joanna',
  'Joey',
  'Justin',
  'Karl',
  'Kendra',
  'Kevin',
  'Kimberly',
  'Lea',
  'Liv',
  'Lotte',
  'Lucia',
  'Lupe',
  'Mads',
  'Maja',
  'Marlene',
  'Mathieu',
  'Matthew',
  'Maxim',
  'Mia',
  'Miguel',
  'Mizuki',
  'Naja',
  'Nicole',
  'Olivia',
  'Penelope',
  'Raveena',
  'Ricardo',
  'Ruben',
  'Russell',
  'Salli',
  'Seoyeon',
  'Takumi',
  'Tatyana',
  'Vicki',
  'Vitoria',
  'Zeina',
  'Zhiyu',
  'Aria',
  'Ayanda',
}
export enum TextType {
  SSML = 'ssml',
  TEXT = 'text',
}
export enum ContentType {
  SSML = 'SSML',
  PLAIN_TEXT = 'PlainText',
}
export enum PollyLanguageCodes {
  'arb',
  'cmn-CN',
  'cy-GB',
  'da-DK',
  'de-DE',
  'en-AU',
  'en-GB',
  'en-GB-WLS',
  'en-IN',
  'en-US',
  'es-ES',
  'es-MX',
  'es-US',
  'fr-CA',
  'fr-FR',
  'is-IS',
  'it-IT',
  'ja-JP',
  'hi-IN',
  'ko-KR',
  'nb-NO',
  'nl-NL',
  'pl-PL',
  'pt-BR',
  'pt-PT',
  'ro-RO',
  'ru-RU',
  'sv-SE',
  'tr-TR',
  'en-NZ',
  'en-ZA',
}
export enum Engine {
  STANDARD = 'standard',
  NEURAL = 'neural',
}
export interface RecordingDestination {
  Type: 'S3';
  BucketName: string;
  Prefix: string;
}
export enum ModifyChimeMeetingAttendeesOperation {
  MUTE = 'Mute',
  UNMUTE = 'Unmute',
}

export enum ParticipantTag {
  LEG_B = 'LEG-B',
  LEG_A = 'LEG-A',
}

export enum CallDetailParticipantDirection {
  OUTBOUND = 'Outbound',
  INBOUND = 'Inbound',
}

export enum CallDetailParticipantStatus {
  CONNECTED = 'Connected',
  DISCONNECTED = 'Disconnected',
}
export interface CallDetailParticipants {
  CallId: string;
  ParticipantTag: ParticipantTag;
  To: string;
  From: string;
  Direction: CallDetailParticipantDirection;
  StartTimeInMilliseconds: string;
  Status: CallDetailParticipantStatus;
}

export enum CallDetailAwsRegion {
  US_EAST_1 = 'us-east-1',
  US_WEST_2 = 'us-west-2',
}
export interface CallDetails {
  TransactionId: string;
  AwsAccountId: string;
  AwsRegion: CallDetailAwsRegion;
  SipRuleId: string;
  SipMediaApplicatonId: string;
  Participants: CallDetailParticipants[];
  TransactionAttributes?: { [key: string]: string };
}

export interface JoinChimeMeetingAction {
  Type: ActionTypes.JOIN_CHIME_MEETING;
  Parameters: CommonActionParameters & JoinChimeMeetingActionParameters;
}

export interface CallAndBridgeAction {
  Type: ActionTypes.CALL_AND_BRIDGE;
  Parameters: CommonActionParameters & CallAndBridgeActionParameters;
}

export interface HangupAction {
  Type: ActionTypes.HANGUP;
  Parameters: CommonActionParameters & HangupActionParameters;
}

export interface SendDigitsAction {
  Type: ActionTypes.SEND_DIGITS;
  Parameters: CommonActionParameters & SendDigitsActionParameters;
}

export interface CallUpdateRequestedActionData {
  Arguments: { [key: string]: string };
}

export interface Actions {
  Type: ActionTypes;
  Parameters: CommonActionParameters &
    (
      | CallAndBridgeActionParameters
      | HangupActionParameters
      | JoinChimeMeetingActionParameters
      | ModifyChimeMeetingAttendeesActionParameters
      | PauseActionParameters
      | PlayAudioActionParameters
      | PlayAudioAndGetDigitsActionParameters
      | ReceiveDigitsActionParameters
      | RecordAudioActionParameters
      | SendDigitsActionParameters
      | SpeakActionParameters
      | SpeakAndGetDigitsActionParameters
      | StartBotConversaionActionParameters
    );
}

export interface ActionData {
  Type: ActionTypes;
  Parameters: CommonActionParameters &
    // | CallAndBridgeActionParameters
    // | HangupActionParameters
    // | JoinChimeMeetingActionParameters
    // | ModifyChimeMeetingAttendeesActionParameters
    // | PauseActionParameters
    // | PlayAudioActionParameters
    // | PlayAudioAndGetDigitsActionParameters
    // | ReceiveDigitsActionParameters
    // | RecordAudioActionParameters
    // | SendDigitsActionParameters
    // | SpeakActionParameters
    // | SpeakAndGetDigitsActionParameters
    // | StartBotConversaionActionParameters
    CallUpdateRequestedActionData;
}
