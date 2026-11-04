// Scales with breaks (discontinuities) and scale padding.
import { warnOnce } from "./util.js";

function isInAnyDiscontinuity(value, breaks) {
  for (let gap of breaks) {
    if (value >= gap.start && value <= gap.end) {
      return true;
    }
  }
  return false;
}

export function createDiscontinuousScale(minStart, maxEnd, width, margin, breaks, reverse = false) {
  // The adjustment loop below stops at the first break right of a value,
  // so the breaks must be sorted by start
  breaks = [...breaks].sort((a, b) => a.start - b.start);

  let totalGap = 0;

  // Calculate the total gap based on all discontinuities
  for (let gap of breaks) {
    if (gap.start >= minStart && gap.end <= maxEnd) {
      totalGap += (gap.end - gap.start);
    }
  }

  // Define the linear scale. Adjust the scale based on the reverse option.
  let domainStart = reverse ? maxEnd - totalGap : minStart;
  let domainEnd = reverse ? minStart : maxEnd - totalGap;

  const linearScale = d3.scaleLinear()
    .domain([domainStart, domainEnd])
    .range([0, width - margin.left - margin.right]);

  // Proxy object for discontinuous scale
  const scaleProxy = function (value) {
    if (isInAnyDiscontinuity(value, breaks)) {
      return null;
    }

    let cumulativeAdjustment = 0;

    // Adjust the value by all previous discontinuities
    for (let gap of breaks) {
      if (value > gap.end) {
        cumulativeAdjustment += (gap.end - gap.start);
      } else {
        break;
      }
    }

    // Apply reverse logic to the value adjustment
    value = value - cumulativeAdjustment;

    return linearScale(value);
  };

  // Dynamically copy all methods and properties from linearScale to scaleProxy
  for (let prop in linearScale) {
    if (typeof linearScale[prop] === 'function') {
      scaleProxy[prop] = (...args) => {
        const result = linearScale[prop](...args);
        return result === linearScale ? scaleProxy : result;
      };
    } else {
      scaleProxy[prop] = linearScale[prop];
    }
  }

  // invert() of the linear scale doesn't know about the breaks: add back the
  // width of every break left of the position (breaks are sorted by start)
  scaleProxy.invert = function (px) {
    let value = linearScale.invert(px);
    for (let gap of breaks) {
      if (value > gap.start) {
        value += (gap.end - gap.start);
      } else {
        break;
      }
    }
    return value;
  };

  return scaleProxy;  // Return the discontinuous scale
}

// The padding is a share of the range shown: the range less the scale breaks in it
export function addScalePadding(startValue, endValue, padding, to, breaks = []) {
  let paddingValue;

  // Check if padding is a percentage string
  if (typeof padding === 'string' && padding.endsWith('%')) {
    paddingValue = parseFloat(padding) / 100;
  }
  // Check if padding is a number between 0 and 100
  else if (typeof padding === 'number' && padding >= 0 && padding <= 100) {
    paddingValue = padding / 100;
  }
  // If padding is not in a valid format or range, log a warning and return the original value
  else {
    warnOnce('Invalid padding format. Padding should be a percentage (as a string or a number between 0 and 100). No padding applied.');
    return to === 'start' ? startValue : endValue;
  }

  // Calculate the range shown, without the scale breaks
  const [low, high] = [Math.min(startValue, endValue), Math.max(startValue, endValue)];
  const gaps = breaks.reduce((sum, gap) =>
    sum + Math.max(0, Math.min(gap.end, high) - Math.max(gap.start, low)), 0);
  const totalRange = high - low - gaps;

  // Calculate the actual padding value based on the total range
  paddingValue = totalRange * paddingValue;

  // Adjust the value based on whether we're padding the start or end
  if (to === 'start') {
    return startValue - paddingValue; // Subtract padding from the start
  } else if (to === 'end') {
    return endValue + paddingValue; // Add padding to the end
  } else {
    console.error('Invalid "to" parameter in addScalePadding. Must be "start" or "end".');
    return to === 'start' ? startValue : endValue; // Return the original value if 'to' is neither
  }
}
