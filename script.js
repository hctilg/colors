const random = (min, max) => (Math.floor(Math.random() * (max - min)) + min);

const mixColors = (...colors) => {
  const totalColors = colors.length;

  let totalRed = 0;
  let totalGreen = 0;
  let totalBlue = 0;

  colors.forEach(color => {
    totalRed += parseInt(color.substring(1, 3), 16);
    totalGreen += parseInt(color.substring(3, 5), 16);
    totalBlue += parseInt(color.substring(5, 7), 16);
  });

  const finalRed = Math.round(totalRed / totalColors);
  const finalGreen = Math.round(totalGreen / totalColors);
  const finalBlue = Math.round(totalBlue / totalColors);

  const finalColor = '#' +
    finalRed.toString(16).padStart(2, '0') +
    finalGreen.toString(16).padStart(2, '0') +
    finalBlue.toString(16).padStart(2, '0');

  return finalColor;
}

const calcRGB = n => {
  if (n < 0 || n > (256 ** 3) - 1) return undefined;
  const b = n % 256;
  var n = Math.floor(n / 256);
  const g = n % 256;
  var n = Math.floor(n / 256);
  const r = n % 256;
  return [r, g, b];
}

const buildPalette = (colorsList) => {
  const paletteContainer = document.getElementById("palette");
  const complementaryContainer = document.getElementById("complementary");
  // reset the HTML in case you load various images
  paletteContainer.innerHTML = "";
  complementaryContainer.innerHTML = "";

  const orderedByColor = orderByLuminance(colorsList);
  const hslColors = convertRGBtoHSL(orderedByColor);

  for (let i = 0; i < orderedByColor.length; i++) {
    const hexColor = rgbToHex(orderedByColor[i]);

    const hexColorComplementary = hslToHex(hslColors[i]);

    if (i > 0) {
      const difference = calculateColorDifference(
        orderedByColor[i],
        orderedByColor[i - 1]
      );

      // if the distance is less than 120 we ommit that color
      if (difference < 120) {
        continue;
      }
    }

    // create the div and text elements for both colors & append it to the document
    const colorElement = document.createElement("div");
    colorElement.style.backgroundColor = hexColor;
    colorElement.appendChild(document.createTextNode(hexColor));
    paletteContainer.appendChild(colorElement);
    // true when hsl color is not black/white/grey
    if (hslColors[i].h) {
      const complementaryElement = document.createElement("div");
      complementaryElement.style.backgroundColor = `hsl(${hslColors[i].h},${hslColors[i].s}%,${hslColors[i].l}%)`;

      complementaryElement.appendChild(
        document.createTextNode(hexColorComplementary)
      );
      complementaryContainer.appendChild(complementaryElement);
    }
  }
};

//  Convert each pixel value ( number ) to hexadecimal ( string ) with base 16
const rgbToHex = (pixel) => {
  const componentToHex = (c) => {
    const hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
  };

  return (
    "#" +
    componentToHex(pixel.r) +
    componentToHex(pixel.g) +
    componentToHex(pixel.b)
  ).toUpperCase();
};

/**
 * Convert HSL to Hex
 * this entire formula can be found in stackoverflow, credits to @icl7126 !!!
 * https://stackoverflow.com/a/44134328/17150245
 */
const hslToHex = (hslColor) => {
  const hslColorCopy = { ...hslColor };
  hslColorCopy.l /= 100;
  const a =
    (hslColorCopy.s * Math.min(hslColorCopy.l, 1 - hslColorCopy.l)) / 100;
  const f = (n) => {
    const k = (n + hslColorCopy.h / 30) % 12;
    const color = hslColorCopy.l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
};

/**
 * Convert RGB values to HSL
 * This formula can be
 * found here https://www.niwa.nu/2013/05/math-behind-colorspace-conversions-rgb-hsl/
 */
const convertRGBtoHSL = (rgbValues) => {
  return rgbValues.map((pixel) => {
    let hue,
      saturation,
      luminance = 0;

    // first change range from 0-255 to 0 - 1
    let redOpposite = pixel.r / 255;
    let greenOpposite = pixel.g / 255;
    let blueOpposite = pixel.b / 255;

    const Cmax = Math.max(redOpposite, greenOpposite, blueOpposite);
    const Cmin = Math.min(redOpposite, greenOpposite, blueOpposite);

    const difference = Cmax - Cmin;

    luminance = (Cmax + Cmin) / 2.0;

    if (luminance <= 0.5) {
      saturation = difference / (Cmax + Cmin);
    } else if (luminance >= 0.5) {
      saturation = difference / (2.0 - Cmax - Cmin);
    }

    /**
     * If Red is max, then Hue = (G-B)/(max-min)
     * If Green is max, then Hue = 2.0 + (B-R)/(max-min)
     * If Blue is max, then Hue = 4.0 + (R-G)/(max-min)
     */
    const maxColorValue = Math.max(pixel.r, pixel.g, pixel.b);

    if (maxColorValue === pixel.r) {
      hue = (greenOpposite - blueOpposite) / difference;
    } else if (maxColorValue === pixel.g) {
      hue = 2.0 + (blueOpposite - redOpposite) / difference;
    } else {
      hue = 4.0 + (greenOpposite - blueOpposite) / difference;
    }

    hue = hue * 60; // find the sector of 60 degrees to which the color belongs

    // it should be always a positive angle
    if (hue < 0) {
      hue = hue + 360;
    }

    // When all three of R, G and B are equal, we get a neutral color: white, grey or black.
    if (difference === 0) {
      return false;
    }

    return {
      h: Math.round(hue) + 180, // plus 180 degrees because that is the complementary color
      s: parseFloat(saturation * 100).toFixed(2),
      l: parseFloat(luminance * 100).toFixed(2),
    };
  });
};

/**
 * Using relative luminance we order the brightness of the colors
 * the fixed values and further explanation about this topic
 * can be found here -> https://en.wikipedia.org/wiki/Luma_(video)
 */
const orderByLuminance = (rgbValues) => {
  const calculateLuminance = (p) => {
    return 0.2126 * p.r + 0.7152 * p.g + 0.0722 * p.b;
  };

  return rgbValues.sort((p1, p2) => {
    return calculateLuminance(p2) - calculateLuminance(p1);
  });
};

const buildRgb = (imageData) => {
  const rgbValues = [];
  // note that we are loopin every 4!
  // for every Red, Green, Blue and Alpha
  for (let i = 0; i < imageData.length; i += 4) {
    const rgb = {
      r: imageData[i],
      g: imageData[i + 1],
      b: imageData[i + 2],
    };

    rgbValues.push(rgb);
  }

  return rgbValues;
};

/**
 * Calculate the color distance or difference between 2 colors
 *
 * further explanation of this topic
 * can be found here -> https://en.wikipedia.org/wiki/Euclidean_distance
 * note: this method is not accuarate for better results use Delta-E distance metric.
 */
const calculateColorDifference = (color1, color2) => {
  const rDifference = Math.pow(color2.r - color1.r, 2);
  const gDifference = Math.pow(color2.g - color1.g, 2);
  const bDifference = Math.pow(color2.b - color1.b, 2);

  return rDifference + gDifference + bDifference;
};

// returns what color channel has the biggest difference
const findBiggestColorRange = (rgbValues) => {
  /**
   * Min is initialized to the maximum value posible
   * from there we procced to find the minimum value for that color channel
   *
   * Max is initialized to the minimum value posible
   * from there we procced to fin the maximum value for that color channel
   */
  let rMin = Number.MAX_VALUE;
  let gMin = Number.MAX_VALUE;
  let bMin = Number.MAX_VALUE;

  let rMax = Number.MIN_VALUE;
  let gMax = Number.MIN_VALUE;
  let bMax = Number.MIN_VALUE;

  rgbValues.forEach((pixel) => {
    rMin = Math.min(rMin, pixel.r);
    gMin = Math.min(gMin, pixel.g);
    bMin = Math.min(bMin, pixel.b);

    rMax = Math.max(rMax, pixel.r);
    gMax = Math.max(gMax, pixel.g);
    bMax = Math.max(bMax, pixel.b);
  });

  const rRange = rMax - rMin;
  const gRange = gMax - gMin;
  const bRange = bMax - bMin;

  // determine which color has the biggest difference
  const biggestRange = Math.max(rRange, gRange, bRange);
  if (biggestRange === rRange) {
    return "r";
  } else if (biggestRange === gRange) {
    return "g";
  } else {
    return "b";
  }
};

/**
 * Median cut implementation
 * can be found here -> https://en.wikipedia.org/wiki/Median_cut
 */
const quantization = (rgbValues, depth) => {
  const MAX_DEPTH = 4;

  // Base case
  if (depth === MAX_DEPTH || rgbValues.length === 0) {
    const color = rgbValues.reduce(
      (prev, curr) => {
        prev.r += curr.r;
        prev.g += curr.g;
        prev.b += curr.b;

        return prev;
      },
      {
        r: 0,
        g: 0,
        b: 0,
      }
    );

    color.r = Math.round(color.r / rgbValues.length);
    color.g = Math.round(color.g / rgbValues.length);
    color.b = Math.round(color.b / rgbValues.length);

    return [color];
  }

  /**
   *  Recursively do the following:
   *  1. Find the pixel channel (red,green or blue) with biggest difference/range
   *  2. Order by this channel
   *  3. Divide in half the rgb colors list
   *  4. Repeat process again, until desired depth or base case
   */
  const componentToSortBy = findBiggestColorRange(rgbValues);
  rgbValues.sort((p1, p2) => {
    return p1[componentToSortBy] - p2[componentToSortBy];
  });

  const mid = rgbValues.length / 2;
  return [
    ...quantization(rgbValues.slice(0, mid), depth + 1),
    ...quantization(rgbValues.slice(mid + 1), depth + 1),
  ];
};

const title_handler = () => {
  var cg = random(132, 170);
  document.querySelector('#title strong').setAttribute('style', `color: ${rgbToHex({ r: cg, g: cg, b: cg })};`);
  document.querySelectorAll('#title span').forEach(element => {
    element.setAttribute('style', `color: ${rgbToHex({
      r: random(15, 255),
      g: random(15, 255),
      b: random(15, 255),
    })};`);
  });
}

const fileToBlob = async (file) => new Blob(file);

document.addEventListener("DOMContentLoaded", ev => {
  title_handler()
  setInterval(title_handler, random(100, 500));

  const gi = document.querySelector('#generator-container > input');
  const gi_ev_handler = ev => {
    var c = calcRGB(+gi.value);
    if (c === undefined) {
      gi.value = (+gi.value < 0) ? 0 : (256 ** 3) - 1;
      return;
    }
    var hex_color = rgbToHex({ r: c[0], g: c[1], b: c[2] });
    document.querySelector('#generator-container').setAttribute('style', `background: ${hex_color};`);
    document.querySelector('#c1 .rgb code').innerHTML = `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
    document.querySelector('#c1 .hex code').innerHTML = hex_color;
  }
  gi.value = random(0, (256 ** 3) - 32);
  gi_ev_handler();
  gi.addEventListener('input', gi_ev_handler);

  const extract_colors = (...files) => {
    const image = new Image();
    const file = files[0];
    const fileReader = new FileReader();

    // Whenever file & image is loaded procced to extract the information from the image
    fileReader.onload = () => {
      image.onload = () => {
        // Set the canvas size to be the same as of the uploaded image
        const canvas = document.getElementById("ext_canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(image, 0, 0);

        /**
         * getImageData returns an array full of RGBA values
         * each pixel consists of four values: the red value of the colour, the green, the blue and the alpha
         * (transparency). For array value consistency reasons,
         * the alpha is not from 0 to 1 like it is in the RGBA of CSS, but from 0 to 255.
         */
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Convert the image data to RGB values so its much simpler
        const rgbArray = buildRgb(imageData.data);

        /**
         * Color quantization
         * A process that reduces the number of colors used in an image
         * while trying to visually maintin the original image as much as possible
         */
        const quantColors = quantization(rgbArray, 0);

        // Create the HTML structure to show the color palette
        buildPalette(quantColors);
      };
      image.src = fileReader.result;
    };
    fileToBlob(file).then(
      blob => fileReader.readAsDataURL(blob)
    )

  }

  (function () {
    const form = document.querySelector('#c2 form');
    const files_input = document.querySelector('#ex_file');

    const preventDrag = (ev, val) => {
      // Prevent default behavior (Prevent file from being opened)
      ev.preventDefault();
      if (!!val) form.setAttribute('drag', 'true');
      else form.removeAttribute('drag');
    };

    form.addEventListener('dragover', ev => preventDrag(ev, true));
    form.addEventListener('dragleave', ev => preventDrag(ev, false));
    form.addEventListener('drop', ev => {
      preventDrag(ev, false);
      if (ev.dataTransfer.items) {
        // Use DataTransferItemList interface to access the file(s)
        const items = ev.dataTransfer.items;
        let files = [];
        Array.from(items).forEach(item => {
          if (item.kind === 'file') {
            const file = item.getAsFile();
            files.push(file);
          }
        });
        extract_colors(files);
      } else {
        // Use DataTransfer interface to access the file(s)
        const files = Array.from(ev.dataTransfer.files);
        extract_colors(files);
      };
    });

    form.addEventListener('change', ev => {
      if (files_input.files.length > 0) {
        const files = Array.from(files_input.files);
        extract_colors(files);
      } else form.reset();
    });

    form.addEventListener('submit', ev => ev.preventDefault());
  })();

  const loadImage = (...files) => {
    const file = files[0];
    const fileReader = new FileReader();
    const canvas = document.getElementById('pik_canvas');
    const ctx = canvas.getContext('2d');
    const image = new Image();
    let currentImage = null; // Store the image for redrawing
    let lastPickedColor = null; // Store the last picked color for copying

    fileReader.addEventListener('load', function () {
      image.onload = () => {
        currentImage = image;

        // Set canvas size to match image (with max width constraint)
        const maxWidth = Math.min(window.innerWidth * 0.9, 800);
        const scale = image.width > maxWidth ? maxWidth / image.width : 1;
        canvas.width = image.width * scale;
        canvas.height = image.height * scale;

        // Draw image to canvas
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        // Show the canvas
        canvas.style.display = 'block';

        // Reset result text and hide copy button
        document.getElementById('res').innerHTML = 'Click on the image to pick a color';
        document.getElementById('color-swatch').style.backgroundColor = 'transparent';
        document.getElementById('copy-color').hidden = true;
        lastPickedColor = null;
      };
      image.src = this.result;
    });

    fileToBlob(file).then(
      blob => fileReader.readAsDataURL(blob)
    );

    // Add click handler for color picking
    canvas.onclick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) * (canvas.width / rect.width));
      const y = Math.floor((e.clientY - rect.top) * (canvas.height / rect.height));

      const pixel = ctx.getImageData(x, y, 1, 1).data;
      const hexColor = rgbToHex({ r: pixel[0], g: pixel[1], b: pixel[2] });
      lastPickedColor = hexColor;

      // Redraw image to clear previous indicator
      if (currentImage) {
        ctx.drawImage(currentImage, 0, 0, canvas.width, canvas.height);
      }

      // Draw click position indicator
      const indicatorRadius = 12;

      // Outer ring (white for contrast)
      ctx.beginPath();
      ctx.arc(x, y, indicatorRadius, 0, 2 * Math.PI);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Inner ring (dark for visibility)
      ctx.beginPath();
      ctx.arc(x, y, indicatorRadius, 0, 2 * Math.PI);
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Center dot
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fillStyle = hexColor;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Update result display
      document.getElementById('res').innerHTML = `Picked: <b>${hexColor}</b> — rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
      document.getElementById('color-swatch').style.backgroundColor = hexColor;

      // Show copy button
      document.getElementById('copy-color').hidden = false;
    };

    // Copy button handler
    document.getElementById('copy-color').onclick = () => {
      if (lastPickedColor) {
        navigator.clipboard.writeText(lastPickedColor).then(() => {
          const btn = document.getElementById('copy-color');
          btn.classList.add('copied');
          btn.title = 'Copied!';
          setTimeout(() => {
            btn.classList.remove('copied');
            btn.title = 'Copy color code';
          }, 1500);
        });
      }
    };
  }

  (function () {
    const form = document.querySelector('#c3 form');
    const files_input = document.querySelector('#pik_file');

    const preventDrag = (ev, val) => {
      // Prevent default behavior (Prevent file from being opened)
      ev.preventDefault();
      if (!!val) form.setAttribute('drag', 'true');
      else form.removeAttribute('drag');
    };

    form.addEventListener('dragover', ev => preventDrag(ev, true));
    form.addEventListener('dragleave', ev => preventDrag(ev, false));
    form.addEventListener('drop', ev => {
      preventDrag(ev, false);
      if (ev.dataTransfer.items) {
        // Use DataTransferItemList interface to access the file(s)
        const items = ev.dataTransfer.items;
        let files = [];
        Array.from(items).forEach(item => {
          if (item.kind === 'file') {
            const file = item.getAsFile();
            files.push(file);
          }
        });
        loadImage(files);
      } else {
        // Use DataTransfer interface to access the file(s)
        const files = Array.from(ev.dataTransfer.files);
        loadImage(files);
      };
    });

    form.addEventListener('change', ev => {
      if (files_input.files.length > 0) {
        const files = Array.from(files_input.files);
        loadImage(files);
      } else form.reset();
    });

    form.addEventListener('submit', ev => ev.preventDefault());
  })();

  const get_mx_colors = () => {
    let colors = [];
    document.querySelectorAll('#mix-colors div').forEach(
      element => colors.push(element.getAttribute('color'))
    );
    return colors;
  };

  const add_btn = document.querySelector('#c4 .add');
  const mx_input = document.querySelector('#c4 input[type=color');
  add_btn.addEventListener('click', ev => {
    var mx_color = document.createElement('div');
    mx_color.setAttribute('style', `background: ${mx_input.value};`);
    mx_color.setAttribute('color', mx_input.value);
    mx_color.onclick = ev => {
      mx_color.remove();
      if (get_mx_colors().length == 0) reset_btn.click();
    }
    if (get_mx_colors().includes(mx_input.value)) return;
    document.getElementById('mix-colors').appendChild(mx_color);
    if (get_mx_colors().length > 0) {
      document.getElementById('c4').classList.remove('null');
      const mixed_color = mixColors(...get_mx_colors());
      document.querySelector('#mixed-color code').innerText = mixed_color;
      document.querySelector('#preview-mix div').setAttribute('style', `background: ${mixed_color};`);
    }

  });

  const reset_btn = document.querySelector('#c4 .reset');
  reset_btn.addEventListener('click', ev => {
    document.getElementById('c4').classList.add('null');
    document.getElementById('mix-colors').innerHTML = '';
  });

});