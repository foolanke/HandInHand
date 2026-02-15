import { useState } from "react";
import { AvatarPreview, PART_COUNTS, PART_LABELS, DEFAULT_AVATAR } from "./avatar-preview";
import type { AvatarConfig } from "./avatar-preview";

const SKIN_COLORS = ["#FDDBB4", "#F5C49C", "#D2956C", "#C17848", "#A0522D", "#6B3A2A", "#4A2511", "#3B1A0A"];
const EYE_COLORS = ["#3B2214", "#1A5276", "#2E7D32", "#5D4037", "#4A148C", "#01579B"];
const HAIR_COLORS = ["#2C1810", "#4A3228", "#8B6914", "#D4A017", "#C0392B", "#E67E22", "#7F8C8D", "#F5E6CA"];

type Category = "skin" | "eyes" | "hair" | "mouth" | "extras";

const CATEGORIES: { key: Category; label: string }[] = [
  { key: "skin", label: "Skin" },
  { key: "eyes", label: "Eyes" },
  { key: "hair", label: "Hair" },
  { key: "mouth", label: "Mouth" },
  { key: "extras", label: "Extras" },
];

interface AvatarBuilderProps {
  value: AvatarConfig;
  onChange: (config: AvatarConfig) => void;
}

function ColorSwatch({
  colors,
  selected,
  onSelect,
}: {
  colors: string[];
  selected: string;
  onSelect: (c: string) => void;
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {colors.map((c) => (
        <button
          key={c}
          onClick={() => onSelect(c)}
          className={`w-8 h-8 rounded-full border-2 transition-all ${
            selected === c
              ? "border-blue-400 scale-110 ring-2 ring-blue-400/40"
              : "border-slate-600 hover:border-slate-400 hover:scale-105"
          }`}
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
  );
}

function StyleGrid({
  count,
  labels,
  selected,
  onSelect,
  renderPreview,
}: {
  count: number;
  labels: string[];
  selected: number;
  onSelect: (i: number) => void;
  renderPreview: (i: number) => React.ReactNode;
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
            selected === i
              ? "bg-blue-500/20 ring-2 ring-blue-400 scale-105"
              : "bg-slate-800/60 hover:bg-slate-700/60 hover:scale-105"
          }`}
        >
          <div className="w-12 h-12 flex items-center justify-center">
            {renderPreview(i)}
          </div>
          <span className="text-[10px] text-slate-400">{labels[i]}</span>
        </button>
      ))}
    </div>
  );
}

export function AvatarBuilder({ value, onChange }: AvatarBuilderProps) {
  const [tab, setTab] = useState<Category>("skin");

  const update = (partial: Partial<AvatarConfig>) => {
    onChange({ ...value, ...partial });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Preview */}
      <div className="flex justify-center">
        <div className="w-28 h-28 bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-700 shadow-lg">
          <AvatarPreview config={value} size={100} />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1 bg-slate-800/50 rounded-xl p-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setTab(cat.key)}
            className={`flex-1 py-2 px-1 rounded-lg text-xs font-medium transition-all ${
              tab === cat.key
                ? "bg-blue-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[140px]">
        {tab === "skin" && (
          <div className="space-y-3">
            <label className="text-xs font-medium text-slate-400">Skin Tone</label>
            <ColorSwatch colors={SKIN_COLORS} selected={value.skinColor} onSelect={(c) => update({ skinColor: c })} />
          </div>
        )}

        {tab === "eyes" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400">Eye Style</label>
              <StyleGrid
                count={PART_COUNTS.eyeStyle}
                labels={PART_LABELS.eyeStyle}
                selected={value.eyeStyle}
                onSelect={(i) => update({ eyeStyle: i })}
                renderPreview={(i) => {
                  const preview = { ...value, eyeStyle: i };
                  return <AvatarPreview config={preview} size={48} />;
                }}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400">Eye Color</label>
              <ColorSwatch colors={EYE_COLORS} selected={value.eyeColor} onSelect={(c) => update({ eyeColor: c })} />
            </div>
          </div>
        )}

        {tab === "hair" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400">Hair Style</label>
              <StyleGrid
                count={PART_COUNTS.hairStyle}
                labels={PART_LABELS.hairStyle}
                selected={value.hairStyle}
                onSelect={(i) => update({ hairStyle: i })}
                renderPreview={(i) => {
                  const preview = { ...value, hairStyle: i };
                  return <AvatarPreview config={preview} size={48} />;
                }}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400">Hair Color</label>
              <ColorSwatch colors={HAIR_COLORS} selected={value.hairColor} onSelect={(c) => update({ hairColor: c })} />
            </div>
          </div>
        )}

        {tab === "mouth" && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400">Mouth Style</label>
            <StyleGrid
              count={PART_COUNTS.mouthStyle}
              labels={PART_LABELS.mouthStyle}
              selected={value.mouthStyle}
              onSelect={(i) => update({ mouthStyle: i })}
              renderPreview={(i) => {
                const preview = { ...value, mouthStyle: i };
                return <AvatarPreview config={preview} size={48} />;
              }}
            />
          </div>
        )}

        {tab === "extras" && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400">Accessories</label>
            <StyleGrid
              count={PART_COUNTS.accessory}
              labels={PART_LABELS.accessory}
              selected={value.accessory}
              onSelect={(i) => update({ accessory: i })}
              renderPreview={(i) => {
                const preview = { ...value, accessory: i };
                return <AvatarPreview config={preview} size={48} />;
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export { DEFAULT_AVATAR };
export type { AvatarConfig };
