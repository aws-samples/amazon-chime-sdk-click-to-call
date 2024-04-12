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
  Actions: Actions[] | undefined | never;
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

export interface StartBotConversationActionParameters {
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
  ADITI = 'Aditi',
  AMY = 'Amy',
  ASTRID = 'Astrid',
  BIANCA = 'Bianca',
  BRIAN = 'Brian',
  CAMILA = 'Camila',
  CARLA = 'Carla',
  CARMEN = 'Carmen',
  CELINE = 'Celine',
  CHANTAL = 'Chantal',
  CONCHITA = 'Conchita',
  CRISTIANO = 'Cristiano',
  DORA = 'Dora',
  EMMA = 'Emma',
  ENRIQUE = 'Enrique',
  EWA = 'Ewa',
  FILIZ = 'Filiz',
  GABRIELLE = 'Gabrielle',
  GERAINT = 'Geraint',
  GIORGIO = 'Giorgio',
  GWYNETH = 'Gwyneth',
  HANS = 'Hans',
  INES = 'Ines',
  IVY = 'Ivy',
  JACEK = 'Jacek',
  JAN = 'Jan',
  JOANNA = 'Joanna',
  JOEY = 'Joey',
  JUSTIN = 'Justin',
  KARL = 'Karl',
  KENDRA = 'Kendra',
  KEVIN = 'Kevin',
  KIMBERLY = 'Kimberly',
  LEA = 'Lea',
  LIV = 'Liv',
  LOTTE = 'Lotte',
  LUCIA = 'Lucia',
  LUPE = 'Lupe',
  MADS = 'Mads',
  MAJA = 'Maja',
  MARLENE = 'Marlene',
  MATHIEU = 'Mathieu',
  MATTHEW = 'Matthew',
  MAXIM = 'Maxim',
  MIA = 'Mia',
  MIGUEL = 'Miguel',
  MIZUKI = 'Mizuki',
  NAJA = 'Naja',
  NICOLE = 'Nicole',
  OLIVIA = 'Olivia',
  PENELOPE = 'Penelope',
  RAVEENA = 'Raveena',
  RICARDO = 'Ricardo',
  RUBEN = 'Ruben',
  RUSSELL = 'Russell',
  SALLI = 'Salli',
  SEOYEON = 'Seoyeon',
  TAKUMI = 'Takumi',
  TATYANA = 'Tatyana',
  VICKI = 'Vicki',
  VITORIA = 'Vitoria',
  ZEINA = 'Zeina',
  ZHIYU = 'Zhiyu',
  ARIA = 'Aria',
  AYANDA = 'Ayanda',
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
  ARB = 'arb',
  CMN_CN = 'cmn-CN',
  CY_GB = 'cy-GB',
  DA_DK = 'da-DK',
  DE_DE = 'de-DE',
  EN_AU = 'en-AU',
  EN_GB = 'en-GB',
  EN_GB_WLS = 'en-GB-WLS',
  EN_IN = 'en-IN',
  EN_US = 'en-US',
  ES_ES = 'es-ES',
  ES_MX = 'es-MX',
  ES_US = 'es-US',
  FR_CA = 'fr-CA',
  FR_FR = 'fr-FR',
  IS_IS = 'is-IS',
  IT_IT = 'it-IT',
  JA_JP = 'ja-JP',
  HI_IN = 'hi-IN',
  KO_KR = 'ko-KR',
  NB_NO = 'nb-NO',
  NL_NL = 'nl-NL',
  PL_PL = 'pl-PL',
  PT_BR = 'pt-BR',
  PT_PT = 'pt-PT',
  RO_RO = 'ro-RO',
  RU_RU = 'ru-RU',
  SV_SE = 'sv-SE',
  TR_TR = 'tr-TR',
  EN_NZ = 'en-NZ',
  EN_ZA = 'en-ZA',
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
  SipMediaApplicationId: string;
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
      | StartBotConversationActionParameters
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
    // | StartBotConversationActionParameters
    CallUpdateRequestedActionData;
}
