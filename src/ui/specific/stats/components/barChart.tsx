'use client';

import { ResponsiveBar } from "@nivo/bar";

type BarDatum = {
  label: string;
  [key: string]: string | number;
};

interface MonthlyStatsChartProps {
  data: BarDatum[];
  keys: string[];
  colors?: Record<string, string>;
  indexBy?: string;
  emptyLabel?: string;
}

const defaultPalette = ["#A5C0E4", "#792525", "#0da36d", "#ff725e", "#facc15"];

const MonthlyStatsChart = ({
  data,
  keys,
  colors = {},
  indexBy = "label",
  emptyLabel = "Aucune donnée à afficher",
}: MonthlyStatsChartProps) => {
  if (!data.length || !keys.length) {
    return (
      <div className="flex items-center justify-center h-60 text-sm text-white/60 border border-dashed border-base-300 rounded-xl">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div style={{ height: 330 }}>
      <ResponsiveBar
        data={data}
        keys={keys}
        indexBy={indexBy}
        margin={{ top: 20, right: 60, bottom: 30, left: 60 }}
        padding={0.4}
        groupMode="grouped"
        enableGridX={false}
        enableGridY={true}
        colors={({ id }) => colors[id as string] || defaultPalette[keys.indexOf(id as string) % defaultPalette.length]}
        theme={{
          grid: {
            line: {
              stroke: "#792525",
              strokeDasharray: "4 4",
            },
          }
        }}
        borderRadius={4}
        enableLabel={false}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: "",
          legendPosition: "middle",
          legendOffset: 24,
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: "",
          legendPosition: "middle",
          legendOffset: -40,
        }}
        animate={true}
        motionConfig="wobbly"
        tooltip={({ id, value, indexValue }) => (
          <div
            style={{
              background: "#1f2937",
              color: "#fff",
              padding: "8px 12px",
              borderRadius: 6,
              fontSize: 13,
              boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
            }}
          >
            <strong>{String(id)}</strong> – {String(indexValue)}
            <br />
            {String(value)}
          </div>
        )}
      />
    </div>
  );
};

export default MonthlyStatsChart;
