/**
 * ExportPDF Component
 *
 * This component exports the current simulation chart view as a PDF file.
 * It uses html2canvas to capture the chart container as a canvas image,
 * then uses jsPDF to generate and download a PDF file containing that image.
 *
 * Note:
 *  - Ensure that the element you wish to capture has an ID of "chart-container".
 *  - Adjust the image placement and dimensions in the jsPDF call as needed.
 */

import React from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const ExportPDF = () => {
  /**
   * exportToPDF - Captures the chart container and generates a PDF.
   *
   * Steps:
   * 1. Select the DOM element with id "chart-container".
   * 2. Use html2canvas to render the element as a canvas.
   * 3. Convert the canvas to a PNG image.
   * 4. Create a new jsPDF document in landscape orientation.
   * 5. Add the image to the PDF with specified dimensions.
   * 6. Trigger the download of the PDF file.
   */
  const exportToPDF = () => {
    // Retrieve the chart container element by its ID.
    const input = document.getElementById('chart-container');
    if (input) {
      // Render the element as a canvas using html2canvas.
      html2canvas(input).then((canvas) => {
        // Convert the canvas to a PNG data URL.
        const imgData = canvas.toDataURL('image/png');
        // Create a new PDF document in landscape mode.
        const pdf = new jsPDF('landscape');
        // Add the image to the PDF.
        // Parameters: (imageData, format, x, y, width, height)
        // Adjust the x, y, width, and height values as needed to fit your chart.
        pdf.addImage(imgData, 'PNG', 10, 10, 280, 150);
        // Save the generated PDF with the given filename.
        pdf.save('simulation_report.pdf');
      });
    }
  };

  return (
    // Render a button that triggers the exportToPDF function when clicked.
    <button
      onClick={exportToPDF}
      className="px-4 py-2 bg-red-500 text-white font-bold rounded hover:bg-red-600 transition-colors"
    >
      Export PDF
    </button>
  );
};

export default ExportPDF;
