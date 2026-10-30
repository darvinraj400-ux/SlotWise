export type IntervalInput<T> = {
  startAt: string | Date;
  endAt: string | Date;
  value: T;
};

export type LanedInterval<T> = {
  start: Date;
  end: Date;
  lane: number;
  laneCount: number;
  value: T;
};

export function layoutIntervals<T>(intervals: IntervalInput<T>[]): LanedInterval<T>[] {
  const sorted = intervals
    .map((interval) => ({
      start: new Date(interval.startAt),
      end: new Date(interval.endAt),
      value: interval.value,
    }))
    .filter(
      (interval) =>
        Number.isFinite(interval.start.getTime()) &&
        Number.isFinite(interval.end.getTime()) &&
        interval.end > interval.start,
    )
    .sort((a, b) => a.start.getTime() - b.start.getTime() || a.end.getTime() - b.end.getTime());

  const output: LanedInterval<T>[] = [];
  let index = 0;

  while (index < sorted.length) {
    const cluster: LanedInterval<T>[] = [];
    let clusterEnd = sorted[index]!.end.getTime();
    let nextIndex = index + 1;

    cluster.push({
      start: sorted[index]!.start,
      end: sorted[index]!.end,
      lane: 0,
      laneCount: 1,
      value: sorted[index]!.value,
    });

    while (nextIndex < sorted.length) {
      const candidate = sorted[nextIndex]!;
      if (candidate.start.getTime() >= clusterEnd) break;
      cluster.push({
        start: candidate.start,
        end: candidate.end,
        lane: 0,
        laneCount: 1,
        value: candidate.value,
      });
      clusterEnd = Math.max(clusterEnd, candidate.end.getTime());
      nextIndex += 1;
    }

    const laneEnds: number[] = [];

    for (const item of cluster) {
      let lane = laneEnds.findIndex((end) => end <= item.start.getTime());
      if (lane === -1) {
        lane = laneEnds.length;
        laneEnds.push(item.end.getTime());
      } else {
        laneEnds[lane] = item.end.getTime();
      }
      item.lane = lane;
    }

    for (const item of cluster) {
      item.laneCount = laneEnds.length;
      output.push(item);
    }

    index = nextIndex;
  }

  return output;
}
