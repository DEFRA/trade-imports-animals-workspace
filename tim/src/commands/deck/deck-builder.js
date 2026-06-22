import PptxGenJS from 'pptxgenjs'

const FORMAT = 'pptx'

const TITLE_FONT_SIZE = 40
const SUBTITLE_FONT_SIZE = 20
const HEADING_FONT_SIZE = 32
const LEAD_FONT_SIZE = 18
const BULLET_FONT_SIZE = 16
const NOTE_FONT_SIZE = 13
const SUMMARY_LINE_FONT_SIZE = 15

const HEADING_COLOR = '1d3552'
const BODY_COLOR = '0b0c0c'
const MUTED_COLOR = '6f777b'

const formatBullet = ({ headline, benefit }) =>
  benefit ? `${headline} — ${benefit}` : headline

const formatCounts = (counts = {}) =>
  Object.entries(counts)
    .map(([category, count]) => `${category}: ${count}`)
    .join('   ')

const addTitleSlide = (pptx, { title, subtitle }) => {
  const slide = pptx.addSlide()
  slide.addText(title, {
    x: 0.5,
    y: 2,
    w: 9,
    h: 1.5,
    fontSize: TITLE_FONT_SIZE,
    bold: true,
    color: HEADING_COLOR
  })
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.5,
      y: 3.5,
      w: 9,
      h: 0.75,
      fontSize: SUBTITLE_FONT_SIZE,
      color: MUTED_COLOR
    })
  }
}

const addSectionSlide = (pptx, section) => {
  const slide = pptx.addSlide()
  slide.addText(section.heading, {
    x: 0.5,
    y: 0.4,
    w: 9,
    h: 0.9,
    fontSize: HEADING_FONT_SIZE,
    bold: true,
    color: HEADING_COLOR
  })
  if (section.lead) {
    slide.addText(section.lead, {
      x: 0.5,
      y: 1.3,
      w: 9,
      h: 0.6,
      fontSize: LEAD_FONT_SIZE,
      italic: true,
      color: MUTED_COLOR
    })
  }
  const bulletItems = (section.bullets ?? []).map((bullet) => ({
    text: formatBullet(bullet),
    options: { bullet: true, fontSize: BULLET_FONT_SIZE, color: BODY_COLOR }
  }))
  if (bulletItems.length > 0) {
    slide.addText(bulletItems, { x: 0.7, y: 2.1, w: 8.6, h: 3.5 })
  }
  if (section.aggregate_note) {
    slide.addText(section.aggregate_note, {
      x: 0.7,
      y: 5.8,
      w: 8.6,
      h: 0.5,
      fontSize: NOTE_FONT_SIZE,
      italic: true,
      color: MUTED_COLOR
    })
  }
}

const summaryLines = (summary) =>
  [
    formatCounts(summary.counts),
    summary.velocity_summary,
    summary.closing
  ].filter((line) => line)

const addSummarySlide = (pptx, summary) => {
  const slide = pptx.addSlide()
  slide.addText(summary.headline, {
    x: 0.5,
    y: 0.4,
    w: 9,
    h: 0.9,
    fontSize: HEADING_FONT_SIZE,
    bold: true,
    color: HEADING_COLOR
  })
  const lines = summaryLines(summary).map((line) => ({
    text: line,
    options: { fontSize: SUMMARY_LINE_FONT_SIZE, color: BODY_COLOR, breakLine: true }
  }))
  if (lines.length > 0) {
    slide.addText(lines, { x: 0.7, y: 1.6, w: 8.6, h: 4 })
  }
}

/**
 * Build a .pptx slide deck from a deck-spec and write it to disk.
 *
 * @param {object} spec - deck-spec.json shape: { title, subtitle, sections[], summary }
 * @param {string} outPath - Absolute path to write the .pptx file to
 * @returns {Promise<{outputPath: string, slideCount: number, format: string}>}
 */
export const buildDeck = async (spec, outPath) => {
  const pptx = new PptxGenJS()
  pptx.layout = 'LAYOUT_WIDE'

  addTitleSlide(pptx, spec)
  for (const section of spec.sections ?? []) addSectionSlide(pptx, section)
  if (spec.summary) addSummarySlide(pptx, spec.summary)

  await pptx.writeFile({ fileName: outPath })

  return {
    outputPath: outPath,
    slideCount: pptx.slides.length,
    format: FORMAT
  }
}
