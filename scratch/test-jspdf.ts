import * as jspdfModule from 'jspdf';
console.log('jspdfModule keys:', Object.keys(jspdfModule));
console.log('jspdfModule.jsPDF:', typeof (jspdfModule as any).jsPDF);
console.log('jspdfModule.default:', typeof (jspdfModule as any).default);
console.log('jspdfModule itself:', typeof jspdfModule);
