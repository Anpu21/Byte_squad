import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  toInputDate,
  type ComparisonView,
  type MetricKey,
} from "../lib/format";
import {
  resolvePreset,
  type PresetKey,
} from "../lib/preset-ranges";
import {
  DEFAULT_METRIC,
  DEFAULT_PRESET,
  DEFAULT_VIEW,
  isComparisonView,
  isInputDate,
  isMetricKey,
  isPresetKey,
  parseBranchIds,
  unique,
} from "./useBranchComparisonPage.lib";

export interface ComparisonParams {
  activePreset: PresetKey;
  startDate: string;
  endDate: string;
  metric: MetricKey;
  view: ComparisonView;
  hasBranchIdsParam: boolean;
  requestedIds: string[];
  setBranchIdsParam: (ids: readonly string[]) => void;
  setPreset: (key: PresetKey) => void;
  setStartDate: (value: string) => void;
  setEndDate: (value: string) => void;
  setMetric: (next: MetricKey) => void;
  setView: (next: ComparisonView) => void;
}

export function useComparisonParams(): ComparisonParams {
  const [searchParams, setSearchParams] = useSearchParams();

  const defaultRange = useMemo(() => {
    return (
      resolvePreset(DEFAULT_PRESET) ?? {
        start: new Date(),
        end: new Date(),
      }
    );
  }, []);

  const presetParam = searchParams.get("preset");
  const startDateParam = searchParams.get("startDate");
  const endDateParam = searchParams.get("endDate");
  const metricParam = searchParams.get("metric");
  const viewParam = searchParams.get("view");
  const hasBranchIdsParam = searchParams.has("branchIds");
  const branchIdsParam = searchParams.get("branchIds");

  const activePreset = isPresetKey(presetParam) ? presetParam : DEFAULT_PRESET;
  const startDate = isInputDate(startDateParam)
    ? startDateParam
    : toInputDate(defaultRange.start);
  const endDate = isInputDate(endDateParam)
    ? endDateParam
    : toInputDate(defaultRange.end);
  const metric = isMetricKey(metricParam) ? metricParam : DEFAULT_METRIC;
  const view = isComparisonView(viewParam) ? viewParam : DEFAULT_VIEW;

  const requestedIds = useMemo(
    () => parseBranchIds(branchIdsParam),
    [branchIdsParam],
  );

  const updateParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          mutate(params);
          return params;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const setBranchIdsParam = useCallback(
    (ids: readonly string[]) => {
      updateParams((params) => {
        params.set("branchIds", unique(ids).join(","));
      });
    },
    [updateParams],
  );

  const setPreset = (key: PresetKey) => {
    const range = resolvePreset(key);
    updateParams((params) => {
      params.set("preset", key);
      if (range) {
        params.set("startDate", toInputDate(range.start));
        params.set("endDate", toInputDate(range.end));
      }
    });
  };

  const setStartDate = (value: string) => {
    updateParams((params) => {
      params.set("startDate", value);
      params.set("preset", "custom");
    });
  };

  const setEndDate = (value: string) => {
    updateParams((params) => {
      params.set("endDate", value);
      params.set("preset", "custom");
    });
  };

  const setMetric = (nextMetric: MetricKey) => {
    updateParams((params) => {
      params.set("metric", nextMetric);
    });
  };

  const setView = (nextView: ComparisonView) => {
    updateParams((params) => {
      params.set("view", nextView);
    });
  };

  return {
    activePreset,
    startDate,
    endDate,
    metric,
    view,
    hasBranchIdsParam,
    requestedIds,
    setBranchIdsParam,
    setPreset,
    setStartDate,
    setEndDate,
    setMetric,
    setView,
  };
}
