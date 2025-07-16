import { useEffect, useRef, useState } from 'react';
import { SQUISHY_TEXT_CONSTANTS } from '../constants';

interface SquishyStyle {
  letterSpacing?: string;
  wordSpacing?: string;
  transform?: string;
  transformOrigin?: string;
  display?: string;
  verticalAlign?: string;
  textOverflow?: string;
  overflow?: string;
  whiteSpace?: string;
  marginRight?: string;
}

// Cache for text measurements
const measurementCache: Map<string, number> = new Map();
let measurementDiv: HTMLDivElement | null = null;

const getMeasurementDiv = (): HTMLDivElement => {
  if (!measurementDiv) {
    measurementDiv = document.createElement('div');
    Object.assign(measurementDiv.style, SQUISHY_TEXT_CONSTANTS.MEASUREMENT_DIV_STYLE);
    document.body.appendChild(measurementDiv);
  }
  return measurementDiv;
};

const measureText = (
  text: string, 
  fontSize: string, 
  fontFamily: string,
  style: SquishyStyle = {},
  className?: string
): number => {
  const cacheKey = `${text}|${fontSize}|${fontFamily}|${JSON.stringify(style)}|${className}`;
  const cached = measurementCache.get(cacheKey);
  if (cached !== undefined) return cached;

  const div = getMeasurementDiv();
  
  // Reset styles
  div.style.cssText = '';
  div.style.position = 'absolute';
  div.style.visibility = 'hidden';
  div.style.height = 'auto';
  div.style.width = 'auto';
  div.style.whiteSpace = 'nowrap';
  div.style.fontSize = fontSize;
  div.style.fontFamily = fontFamily;
  
  // Apply custom styles
  if (style.letterSpacing) div.style.letterSpacing = style.letterSpacing;
  if (style.wordSpacing) div.style.wordSpacing = style.wordSpacing;
  if (style.transform) div.style.transform = style.transform;
  
  // Apply class if provided
  div.className = className || '';
  
  // Set text
  div.textContent = text;
  
  // Measure
  const width = div.offsetWidth;
  
  // Cache for performance
  if (measurementCache.size > SQUISHY_TEXT_CONSTANTS.CACHE_SIZE_LIMIT) {
    // Clear old entries
    const firstKey = measurementCache.keys().next().value;
    if (firstKey) measurementCache.delete(firstKey);
  }
  measurementCache.set(cacheKey, width);
  
  return width;
};

export const useSquishyText = (
  text: string,
  containerWidth: number,
  fontSize: string = SQUISHY_TEXT_CONSTANTS.FONT_SIZE,
  fontFamily: string = SQUISHY_TEXT_CONSTANTS.FONT_FAMILY,
  className?: string
) => {
  const [style, setStyle] = useState<SquishyStyle>({});
  const elementRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!text || containerWidth <= 0) {
      setStyle({});
      return;
    }

    // Quick check - if text is obviously small, don't process
    const fontSizePx = parseFloat(fontSize);
    const quickSize = fontSizePx * text.length;
    if (quickSize < 0.5 * containerWidth) {
      setStyle({});
      return;
    }

    // Start with normal text width
    const normalWidth = measureText(text, fontSize, fontFamily, {}, className);
    
    if (normalWidth <= containerWidth) {
      // Text fits normally
      setStyle({});
      return;
    }

    // Calculate compression limits based on font size (matching original)
    const globalMaxComp = 1 - Math.exp(-fontSizePx / 13);
    const maxLetterContraction = 1 * (fontSizePx / 13) * globalMaxComp; // in pixels
    const maxWordContraction = 3 * (fontSizePx / 13) * globalMaxComp; // in pixels
    const maxXScale = 0.2 * globalMaxComp; // max 20% scale compression

    // Calculate letter and word counts
    const words = text.split(/\s+/);
    const letterCount = text.length - words.length; // excluding spaces
    const wordSpaceCount = words.length - 1;

    // Try letter spacing adjustment
    let letterSpacing = 0;
    if (letterCount > 0) {
      letterSpacing = Math.max(-maxLetterContraction, -0.5 * (normalWidth - containerWidth) / letterCount);
    }

    // Measure with letter spacing
    let currentStyle: SquishyStyle = letterSpacing ? { letterSpacing: `${letterSpacing}px` } : {};
    let currentWidth = measureText(text, fontSize, fontFamily, currentStyle, className);

    // Try word spacing if still doesn't fit
    let wordSpacing = 0;
    if (currentWidth > containerWidth && wordSpaceCount > 0) {
      wordSpacing = Math.max(-maxWordContraction, -1 * (currentWidth - containerWidth) / wordSpaceCount);
      currentStyle = {
        letterSpacing: letterSpacing ? `${letterSpacing}px` : undefined,
        wordSpacing: `${wordSpacing}px`
      };
      currentWidth = measureText(text, fontSize, fontFamily, currentStyle, className);
    }

    // Apply styles
    if (currentWidth <= containerWidth) {
      setStyle({
        letterSpacing: letterSpacing ? `${letterSpacing}px` : undefined,
        wordSpacing: wordSpacing ? `${wordSpacing}px` : undefined,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: 'inline-block',
        verticalAlign: 'middle'
      });
      return;
    }

    // Last resort: minimal scale compression
    const scaleNeeded = containerWidth / currentWidth;
    const minScale = 1 - maxXScale; // e.g., 0.8 for 20% max compression
    const scale = Math.max(scaleNeeded, minScale);
    
    setStyle({
      letterSpacing: letterSpacing ? `${letterSpacing}px` : undefined,
      wordSpacing: wordSpacing ? `${wordSpacing}px` : undefined,
      transform: `scaleX(${scale})`,
      transformOrigin: 'left center',
      display: 'inline-block',
      verticalAlign: 'middle',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      marginRight: `-${(1 - scale) * currentWidth}px`
    });
  }, [text, containerWidth, fontSize, fontFamily, className]);

  return { style, ref: elementRef };
};