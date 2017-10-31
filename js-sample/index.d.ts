/* beautify preserve:start */

declare interface NumberMap {
  [key: string]: number
}
// declare interface Map<A> {
  // [key: string]: A
// }

declare type ConnectionId = string;
declare type Connection = {
  connectionId: ConnectionId,
  creationTime: number,
  data: string
}
declare type VideoType = 'camera' | 'screen';
declare type TestVideoDimensions = { width: 1280, height: 720 } | { width: 640, height: 480 } | { width: 320, height: 240 };
declare type TestStream = {
  connection: Connection,
  creationTime: number,
  frameRate: number,
  hasAudio: boolean,
  hasVideo: boolean,
  name: string,
  streamId: string,
  videoDimensions: TestVideoDimensions,
  videoType: VideoType
};
declare type TestSubscriber = { stream: TestStream, getStats: (callback: (error: Error | null, stats: Stats) => void) => void };
declare type TestConfig = { subscriber: TestSubscriber, timeout?: number };
declare interface BaseStats {
  bytesReceived: number;
  packetsLost: number;
  packetsReceieved: number;
}
declare interface AudioStats extends BaseStats {}
declare interface VideoStats extends AudioStats {
  frameRate: number;
}
declare type BaseStatsMap = {
  audio: BaseStats,
  video: BaseStats,
}
declare type StatsBuilder = {
  bytesReceived: number,
  packetsLost: number,
  packetsReceieved: number
};

declare type Stats = {
  readonly audio: AudioStats,
  readonly video: VideoStats,
  readonly timestamp: number;
}
declare type AudioProperty = keyof BaseStats;
declare type VideoProperty = keyof BaseStats;
declare type Timestamp = number;
declare type StatProperty = AudioProperty | VideoProperty;
declare type AV = 'audio' | 'video';

declare enum Resolution {
  High = '1280x720',
  Medium = '640x480',
  Low = '320x240'
}

declare enum QualityRating {
  Excellent = 5,
  Good = 4,
  Fair = 3,
  Poor = 2,
  Bad = 1
}

declare type BandwidthCalculatorProps = {
  subscriber: TestSubscriber,
  pollingInterval?: number,
  windowSize?: number
};

declare type Snapshot = {
  audio: BaseStats,
  video: BaseStats,
  timestamp: Timestamp
};

declare type PerSecondStatsProps = {
  packetsPerSecond: number,
  bitsPerSecond: number,
  packetsLostPerSecond: number,
  packetLossRatioPerSecond: number
};
/* beautify preserve:end */