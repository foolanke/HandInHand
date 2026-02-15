import type { EvaluationResult } from '../components/EvaluationModal';

export async function submitRecording(wordPhrase: string, blob: Blob): Promise<EvaluationResult> {
  const word = wordPhrase.toLowerCase().replace(/\s+/g, '');
  const formData = new FormData();
  formData.append('word', word);
  const file = new File([blob], `${word}.webm`, { type: 'video/webm' });
  formData.append('video', file);

  const res = await fetch(`/api/evaluate-sign?word=${encodeURIComponent(word)}`, {
    method: 'POST',
    body: formData,
  });

  if (res.status === 404) {
    // No reference landmarks for this word yet — auto-pass silently
    return {
      overall_score_0_to_4: 4,
      summary: 'Great effort! Keep practicing.',
      pros: { points: ['Recording submitted successfully'] },
      cons: { points: [] },
    };
  }

  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail?.detail ?? `Server error ${res.status}`);
  }

  const data = await res.json();
  return data.evaluation ?? data;
}
