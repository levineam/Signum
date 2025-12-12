import { describe, expect, it } from 'vitest'
import {
  extractTranscriptParams,
  extractVisitorData,
  generateTranscriptParamVariants,
  parseYoutubeiTranscriptResponse,
} from '@/lib/youtube/youtubeiTranscript'

describe('youtubeiTranscript helpers', () => {
  it('extractVisitorData finds visitorData', () => {
    const html = '<script>var x={"visitorData":"ABC123xyz"};</script>'
    expect(extractVisitorData(html)).toBe('ABC123xyz')
  })

  it('extractTranscriptParams finds getTranscriptEndpoint.params', () => {
    const html =
      '{"getTranscriptEndpoint":{"params":"PARAMS_FROM_PAGE_0123456789"}}'
    expect(extractTranscriptParams(html)).toBe('PARAMS_FROM_PAGE_0123456789')
  })

  it('generateTranscriptParamVariants produces 4 candidates', () => {
    const variants = generateTranscriptParamVariants('dQw4w9WgXcQ')
    expect(variants).toHaveLength(4)
    // Should be fairly long and never include raw '=' padding (we URL-encode it if present).
    for (const v of variants) {
      expect(v.length).toBeGreaterThan(20)
      expect(v.includes('=')).toBe(false)
    }
  })

  it('parseYoutubeiTranscriptResponse extracts segments', () => {
    const payload = {
      actions: [
        {
          updateEngagementPanelAction: {
            content: {
              transcriptRenderer: {
                content: {
                  transcriptSearchPanelRenderer: {
                    body: {
                      transcriptSegmentListRenderer: {
                        initialSegments: [
                          {
                            transcriptSegmentRenderer: {
                              startMs: '1000',
                              endMs: '2500',
                              snippet: { runs: [{ text: 'Hello' }] },
                            },
                          },
                          {
                            transcriptSegmentRenderer: {
                              startMs: '2500',
                              endMs: '4000',
                              snippet: { runs: [{ text: 'world' }] },
                            },
                          },
                        ],
                      },
                    },
                  },
                },
              },
            },
          },
        },
      ],
    }

    const segs = parseYoutubeiTranscriptResponse(payload)
    expect(segs).toEqual([
      { text: 'Hello', startMs: 1000, endMs: 2500 },
      { text: 'world', startMs: 2500, endMs: 4000 },
    ])
  })
})


