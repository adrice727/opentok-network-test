/* beautify preserve:start */
/**
 * Network test
 */

declare type ConnectionId = string;
declare type Connection = {
  connectionId: ConnectionId,
  creationTime: number,
  data: string
}
declare type VideoType = 'camera' | 'screen';

// declare type QualityRating = 1 | 2 | 3 | 4 | 5;
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


declare type StatsBuilder = {
  audio: CanBuildStats,
  video: CanBuildStats,
}

declare type CanBuildStats = {
  bytesReceived?: number,
  packetsLost?: number,
  packetsReceieved?: number
};


class Stats {
  bytesReceived: number | void;
  packetsLost: number | void;
  packetsReceieved: number | void;
  constructor(bytesReceived: number, packetsLost: number, packetsReceived: number) {
    this.bytesReceived = bytesReceived;
    this.packetsLost = packetsLost;
    this.packetsReceieved = packetsReceived;
  }

  static fromBuilder(buildFrom: CanBuildStats) {
    return new Stats(
      buildFrom.bytesReceived || null,
      buildFrom.packetsLost || null ,
      buildFrom.packetsReceieved || null
    );
  }

  static default(): Stats {
    return new Stats(0,0,0);
  }
}

declare type AudioStats = CanBuildStats;
declare type VideoStats = CanBuildStats;
// declare type CanBuildAudioStats = CanBuildStats;
// declare type CanBuildVideoStats = CanBuildStats;
declare type AudioProperty = keyof CanBuildStats;
declare type VideoProperty = keyof CanBuildStats;


// declare type BaseStats = {
//   bytesReceived: number,
//   packetsLost: number,
//   packetsReceieved: number
// };
// declare type AudioStats = BaseStats;
// declare type VideoStats = BaseStats;
// declare type AudioProperty = $Keys<BaseStats>;
// declare type VideoProperty = $Keys<VideoStats>;

// declare type Stats = {
//   audio: AudioStats,
//   video: VideoStats,
//   timestamp: number
// };


class StatsCollection {
  audio: Stats;
  video: Stats;
  timestamp: Timestamp
  constructor(buildFrom: StatsBuilder, timestamp: Timestamp) {
    this.audio = Stats.fromBuilder(buildFrom.audio) || Stats.default();
    this.video = Stats.fromBuilder(buildFrom.video) || Stats.default();
    this.timestamp = timestamp;
  }

}

declare type TestSubscriber = { stream: TestStream, getStats: (callback: (error: Error | null, stats: Stats) => void) => void };

/* ********** */
type StatProperty = AudioProperty | VideoProperty;
type AV = 'audio' | 'video';
const TEST_TIMEOUT_MS = 15000;
enum QualityRating {
  Excellent = 5,
  Good = 4,
  Fair = 3,
  Poor = 2,
  Bad = 1
};

type BandwidthCalculatorProps = {
  subscriber: TestSubscriber,
  pollingInterval?: number,
  windowSize?: number
};
type Timestamp = number;

type Snapshot = {
  audio: AudioStats,
  video: VideoStats,
  timestamp: Timestamp
};

type PerSecondStatsProps = {
  packetsPerSecond: number,
  bitsPerSecond: number,
  packetsLostPerSecond: number,
  packetLossRatioPerSecond: number
};
type PerSecondStats = {
  audio: PerSecondStatsProps,
  video: PerSecondStatsProps,
  windowSize: number,
  elapsedTimeMs?: number
};

enum Resolution {
  High = '1280x720',
  Medium = '640x480',
  Low = '320x240'
}
/* beautify preserve:end */

function max(numbers: number[]): number { return Math.max.apply(undefined, numbers); }
function min(numbers: number[]): number { return Math.min.apply(undefined, numbers); }
function pluck<A>(list: Array<{ [key: string]: A }>, property: string): A[] {
  return list.reduce((acc, obj) => obj[property] ? acc.concat(obj[property]) : acc, [])
}
function sum(values: number[]): number {
  return values.reduce((acc: number, a: number): number => acc + a, 0);
}


const analyzeStats = (results: PerSecondStats, subscriber: TestSubscriber): QualityRating => {
  // if (!subscriber || !subscriber.stream) return MOSQuality.Bad;
  if (subscriber && subscriber.stream && subscriber.stream.hasVideo) {
    const videoBw = results.video.bitsPerSecond / 1000;
    const videoPLRatio = results.video.packetLossRatioPerSecond;
    const frameRate = (subscriber.stream.frameRate && subscriber.stream.frameRate.toString()) || '30';
    const { width, height }: TestVideoDimensions = subscriber.stream.videoDimensions;
    const resolution: String = `${width}x${height}`;
    if (resolution === Resolution.High) {
      const aVideoLimits = {
        '1280x720-30': [250, 350, 600, 1000],
        '1280x720-15': [150, 250, 350, 800],
        '1280x720-7': [120, 150, 250, 400],
      };
      if (videoBw > aVideoLimits[3] && videoPLRatio < 0.1) {
        return QualityRating.Excellent;
      } else if (videoBw > aVideoLimits[2] && videoBw <= aVideoLimits[3] && videoPLRatio < 0.02) {
        return QualityRating.Good;
      } else if (videoBw > aVideoLimits[2] && videoBw <= aVideoLimits[3] && videoPLRatio > 0.02 && videoPLRatio < 0.1) {
        return QualityRating.Fair;
      } else if (videoBw > aVideoLimits[1] && videoBw <= aVideoLimits[2] && videoPLRatio < 0.1) {
        return QualityRating.Fair;
      } else if (videoBw > aVideoLimits[0] && videoPLRatio > 0.1) {
        return QualityRating.Poor;
      } else if (videoBw > aVideoLimits[0] && videoBw <= aVideoLimits[1] && videoPLRatio < 0.1) {
        return QualityRating.Poor;
      } else if (videoBw < aVideoLimits[0] || videoPLRatio > 0.1) {
        return QualityRating.Bad;
      }
      return QualityRating.Bad;
    } else if (resolution === Resolution.Medium) {
      switch (frameRate) {
        case '30':
          if (videoBw > 600 && videoPLRatio < 0.1) {
            return QualityRating.Excellent;
          } else if (videoBw > 250 && videoBw <= 600 && videoPLRatio < 0.02) {
            return QualityRating.Good;
          } else if (videoBw > 250 && videoBw <= 600 && videoPLRatio > 0.02 && videoPLRatio < 0.1) {
            return QualityRating.Fair;
          } else if (videoBw > 150 && videoBw <= 250 && videoPLRatio < 0.1) {
            return QualityRating.Fair;
          } else if (videoPLRatio > 0.1 && videoBw > 150) {
            return QualityRating.Poor;
          } else if (videoBw > 120 && videoBw <= 150 && videoPLRatio < 0.1) {
            return QualityRating.Poor;
          } else if (videoBw < 120 || videoPLRatio > 0.1) {
            return QualityRating.Bad;
          }
          return QualityRating.Bad;
        case '15':
          if (videoBw > 400 && videoPLRatio < 0.1) {
            return QualityRating.Excellent;
          } else if (videoBw > 200 && videoBw <= 400 && videoPLRatio < 0.02) {
            return QualityRating.Good;
          } else if (videoBw > 150 && videoBw <= 200 && videoPLRatio > 0.02 && videoPLRatio < 0.1) {
            return QualityRating.Fair;
          } else if (videoBw > 120 && videoBw <= 150 && videoPLRatio < 0.1) {
            return QualityRating.Fair;
          } else if (videoPLRatio > 0.1 && videoBw > 120) {
            return QualityRating.Poor;
          } else if (videoBw > 75 && videoBw <= 120 && videoPLRatio < 0.1) {
            return QualityRating.Poor;
          } else if (videoBw < 75 || videoPLRatio > 0.1) {
            return QualityRating.Bad;
          }
          return QualityRating.Bad;
        case '7':
          if (videoBw > 200 && videoPLRatio < 0.1) {
            return QualityRating.Excellent;
          } else if (videoBw > 150 && videoBw <= 200 && videoPLRatio < 0.02) {
            return QualityRating.Good;
          } else if (videoBw > 120 && videoBw <= 150 && videoPLRatio > 0.02 && videoPLRatio < 0.1) {
            return QualityRating.Fair;
          } else if (videoBw > 75 && videoBw <= 120 && videoPLRatio < 0.1) {
            return QualityRating.Fair;
          } else if (videoPLRatio > 0.1 && videoBw > 50) {
            return QualityRating.Poor;
          } else if (videoBw > 50 && videoBw <= 75 && videoPLRatio < 0.1) {
            return QualityRating.Poor;
          } else if (videoBw < 50 || videoPLRatio > 0.1) {
            return QualityRating.Bad;
          }
          return QualityRating.Bad;
        default:
          return QualityRating.Bad;
      }
    } else if (resolution === Resolution.Low) {
      switch (frameRate) {
        case '30':
          if (videoBw > 300 && videoPLRatio < 0.1) {
            return QualityRating.Excellent;
          } else if (videoBw > 200 && videoBw <= 300 && videoPLRatio < 0.02) {
            return QualityRating.Good;
          } else if (videoBw > 120 && videoBw <= 200 && videoPLRatio > 0.02 && videoPLRatio < 0.1) {
            return QualityRating.Fair;
          } else if (videoBw > 120 && videoBw <= 200 && videoPLRatio < 0.1) {
            return QualityRating.Fair;
          } else if (videoPLRatio > 0.1 && videoBw > 120) {
            return QualityRating.Poor;
          } else if (videoBw > 100 && videoBw <= 120 && videoPLRatio < 0.1) {
            return QualityRating.Poor;
          } else if (videoBw < 100 || videoPLRatio > 0.1) {
            return QualityRating.Bad;
          }
          return QualityRating.Bad;
        case '15':
          if (videoBw > 200 && videoPLRatio < 0.1) {
            return QualityRating.Excellent;
          } else if (videoBw > 150 && videoBw <= 200 && videoPLRatio < 0.02) {
            return QualityRating.Good;
          } else if (videoBw > 120 && videoBw <= 150 && videoPLRatio > 0.02 && videoPLRatio < 0.1) {
            return QualityRating.Fair;
          } else if (videoBw > 120 && videoBw <= 150 && videoPLRatio < 0.1) {
            return QualityRating.Fair;
          } else if (videoPLRatio > 0.1 && videoBw > 120) {
            return QualityRating.Poor;
          } else if (videoBw > 100 && videoBw <= 120 && videoPLRatio < 0.1) {
            return QualityRating.Poor;
          } else if (videoBw < 100 || videoPLRatio > 0.1) {
            return QualityRating.Bad;
          }
          return MOSQuality.Bad;
        case '7':
          if (videoBw > 150 && videoPLRatio < 0.1) {
            return QualityRating.Excellent;
          } else if (videoBw > 100 && videoBw <= 150 && videoPLRatio < 0.02) {
            return QualityRating.Good;
          } else if (videoBw > 100 && videoBw <= 150 && videoPLRatio > 0.02 && videoPLRatio < 0.1) {
            return QualityRating.Fair;
          } else if (videoBw > 75 && videoBw <= 100 && videoPLRatio < 0.1) {
            return QualityRating.Fair;
          } else if (videoPLRatio > 0.1 && videoBw > 75) {
            return QualityRating.Poor;
          } else if (videoBw > 50 && videoBw <= 75 && videoPLRatio < 0.1) {
            return QualityRating.Poor;
          } else if (videoBw < 50 || videoPLRatio > 0.1) {
            return QualityRating.Bad;
          }
          return QualityRating.Bad;
        default:
          return QualityRating.Bad;
      }
    }
    return QualityRating.Bad;
  }
  const audioBw = results.audio.bitsPerSecond / 1000;
  const audioPLRadio = results.audio.packetLossRatioPerSecond;
  if (audioBw > 30 && audioPLRadio < 0.5) {
    return QualityRating.Excellent;
  } else if (audioBw > 25 && audioPLRadio < 5) {
    return QualityRating.Good;
  }
  return QualityRating.Bad;
};

const calculatePerSecondStats = (statsBuffer: Snapshot[], seconds: number): PerSecondStats => {

  const stats = { windowSize: seconds, audio: {}, video: {} };
  ['video', 'audio'].forEach((type: AV) => {
    stats[type] = {
      packetsPerSecond: (sum(pluck(pluck(statsBuffer, type), 'packetsReceived'))) / seconds,
      bitsPerSecond: (sum(pluck(pluck(statsBuffer, type), 'bytesReceived')) * 8) / seconds,
      packetsLostPerSecond: (sum(pluck(pluck(statsBuffer, type), 'packetsLost'))) / seconds,
    };
    stats[type].packetLossRatioPerSecond = (
      stats[type].packetsLostPerSecond / stats[type].packetsPerSecond
    );
  });
  return stats;
};

const getSampleWindowSize = (samples: Snapshot[]): number => {
  const times: Timestamp[] = samples.map((s: Snapshot): number => s.timestamp);
  return (max(times) - min(times)) / 1000;
};

class BandwidthCalculator {

  intervalId: number;
  pollingInterval: number;
  windowSize: number;
  subscriber: TestSubscriber;

  constructor(config: BandwidthCalculatorProps) {
    this.pollingInterval = config.pollingInterval || 500;
    this.windowSize = config.windowSize || 2000;
    this.subscriber = config.subscriber;
    this.start = this.start.bind(this);
    this.end = this.end.bind(this);
  }

  start(reportFunction: PerSecondStats => void) {
    const statsBuffer: Snapshot[] = [];
    const last = {
      audio: {},
      video: {},
    };
    this.intervalId = setInterval(() => {
      this.subscriber.getStats((error: Error | null, stats: Stats | void) => {
        const snapshot = {};
        const nowMs = new Date().getTime();
        if (!stats) {
          clearInterval(this.intervalId);
          return;
        }

        /* eslint-disable flowtype/no-weak-types */
        ['audio', 'video'].forEach((type: AV) => { // $FlowFixMe
          snapshot[type] = Object.keys(stats[type]).reduce((acc: Object, key: StatProperty): AudioStats | VideoStats => {
            // $FlowFixMe
            const delta = stats[type][key] - (last[type][key] || 0); // $FlowFixMe
            last[type][key] = stats[type][key];
            return Object.assign({}, acc, { [key]: delta });
          }, { [type]: {} });
        });
        /* eslint-enable flowtype/no-weak-types */

        // get a snapshot of now, and keep the last values for next round
        snapshot.timestamp = stats.timestamp;
        statsBuffer.push(snapshot);

        const filteredBuffer = statsBuffer.filter((s: Snapshot): boolean => (nowMs - s.timestamp) < this.windowSize);

        const sampleWindowSize = getSampleWindowSize(statsBuffer);

        if (sampleWindowSize !== 0) {
          reportFunction(calculatePerSecondStats(
            filteredBuffer,
            sampleWindowSize,
          ));
        }
      });
    }, this.pollingInterval);
  }
  end() {
    clearInterval(this.intervalId);
  }
}

type TestConfig = { subscriber: TestSubscriber };
const performQualityTest = (config: TestConfig): Promise<QualityRating> =>
  new Promise((resolve, reject) => {
    const startMs = new Date().getTime();
    let testTimeout;
    let currentStats;

    const bandwidthCalculator = new BandwidthCalculator({ subscriber: config.subscriber });

    const cleanupAndReport = () => {
      if (!currentStats) {
        reject(new Error('Failed to calculate network statistics'));
      } else {
        currentStats.elapsedTimeMs = new Date().getTime() - startMs;
        const quality: QualityRating = analyzeStats(currentStats, config.subscriber);
        clearTimeout(testTimeout);
        bandwidthCalculator.end();
        resolve(quality);
      }
    };

    // bail out of the test after 30 seconds
    setTimeout(cleanupAndReport, TEST_TIMEOUT_MS);

    bandwidthCalculator.start((stats: PerSecondStats) => {
      currentStats = stats;
      resolve(analyzeStats(currentStats, config.subscriber));
    });
  });

export default performQualityTest;
