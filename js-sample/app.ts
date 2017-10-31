const TEST_TIMEOUT_MS = 15000;
const max = (numbers: number[]): number => Math.max.apply(undefined, numbers);
const min = (numbers: number[]): number => Math.min.apply(undefined, numbers);
const flatMap = <A, B>(f: (A) => B[], list: A[]): B[] => {
  return list.map(f).reduce((acc, ls) => acc.concat(ls), [])
}
const sum = (values: number[]): number =>
  values.reduce((acc: number, a: number): number => acc + a, 0);

class PerSecondStats {
  audio: PerSecondStatsProps
  video: PerSecondStatsProps
  windowSize: number
  elapsedTimeMs?: number

  constructor(windowSize: number, audio: NumberMap, video: NumberMap) {
    this.windowSize = windowSize;
    this.audio = this.extendMap(audio);
    this.video = this.extendMap(video);
  }

  private extendMap(map: NumberMap): PerSecondStatsProps {
    return {
      packetsPerSecond: map.packetsPerSecond || 0,
      bitsPerSecond: map.bitsPerSecond || 0,
      packetsLostPerSecond: map.packetsLostPerSecond || 0,
      packetLossRatioPerSecond: map.packetLossRatioPerSecond || 0
    }
  }
};

const analyzeStats = (results: PerSecondStats, subscriber: TestSubscriber): QualityRating => {

  if (subscriber && subscriber.stream && subscriber.stream.hasVideo) {
    const videoBw = results.video.bitsPerSecond / 1000;
    const videoPLRatio = results.video.packetLossRatioPerSecond;
    const frameRate = (subscriber.stream.frameRate && subscriber.stream.frameRate.toString()) || '30';
    const { width, height }: TestVideoDimensions = subscriber.stream.videoDimensions;
    const resolution: String = `${width}x${height}`;
    if (resolution === Resolution.High) {
      const aVideoLimits = {
        '30': [250, 350, 600, 1000],
        '15': [150, 250, 350, 800],
        '7': [120, 150, 250, 400],
      }[frameRate];
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
          return QualityRating.Bad;
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

  const stats: { audio: NumberMap, video: NumberMap } = { audio: {}, video: {} };
  ['video', 'audio'].forEach((type: AV) => {
    stats[type] = {
      packetsPerSecond: sum(flatMap(s => s[type].map(ss => ss.packetsReceieved), statsBuffer)) / seconds,
      bitsPerSecond: sum(flatMap(s => s[type].map(ss => ss.bytesReceived), statsBuffer)) / seconds,
      packetsLostPerSecond: sum(flatMap(s => s[type].map(s => s.packetsLost), statsBuffer)) / seconds,
    };
    stats[type].packetLossRatioPerSecond = (
      stats[type].packetsLostPerSecond / statsBuffer[type].packetsPerSecond
    );
  });

  return new PerSecondStats(seconds, stats.audio, stats.video)

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

  start(reportFunction: (PerSecondStats) => void) {
    const statsBuffer: Snapshot[] = [];
    const emptyStats = (): BaseStats => ({
      bytesReceived: 0,
      packetsLost: 0,
      packetsReceieved: 0
    })
    const last: { audio: BaseStats, video: BaseStats } = {
      audio: emptyStats(),
      video: emptyStats()
    };
    this.intervalId = setInterval(() => {
      this.subscriber.getStats((error: Error | null, stats: Stats | void) => {
        const update = { audio: emptyStats(), video: emptyStats() };
        const nowMs = new Date().getTime();
        if (!stats) {
          clearInterval(this.intervalId);
          return;
        }

        ['audio', 'video'].forEach((type: AV) => {
          update[type] = Object.keys(stats[type]).reduce((acc: BaseStats, key: StatProperty): BaseStats => {
            const delta = stats[type][key] - (last[type][key] || 0);
            last[type][key] = stats[type][key];
            return Object.assign({}, acc, { [key]: delta });
          }, emptyStats());
        });

        // get a snapshot of now, and keep the last values for next round
        const snapshot: Snapshot = {
          audio: update.audio,
          video: update.video,
          timestamp: stats.timestamp
        }
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

const performQualityTest = (config: TestConfig): Promise<QualityRating> =>
  new Promise((resolve, reject) => {
    const startMs = new Date().getTime();
    let testTimeout: any;
    let currentStats: PerSecondStats;

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
    testTimeout = setTimeout(cleanupAndReport, TEST_TIMEOUT_MS);

    bandwidthCalculator.start((stats: PerSecondStats) => {
      currentStats = stats;
      resolve(analyzeStats(currentStats, config.subscriber));
    });
  });

export default performQualityTest;
