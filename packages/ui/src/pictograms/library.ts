import type { PictogramKey } from '@indoor/domain';
import type { PictogramPart } from './shapes';

const STROKE = 1.75;

export const LUCIDE_VERSION = '1.48.0';

export const LIBRARY_SHAPES: Partial<Record<PictogramKey, readonly PictogramPart[]>> = {
  wifi: [
    { d: 'M12 20h.01', stroke: STROKE },
    { d: 'M2 8.82a15 15 0 0 1 20 0', stroke: STROKE },
    { d: 'M5 12.859a10 10 0 0 1 14 0', stroke: STROKE },
    { d: 'M8.5 16.429a5 5 0 0 1 7 0', stroke: STROKE },
  ],
  'phone-charging': [
    { d: 'm11 7-3 5h4l-3 5', stroke: STROKE },
    { d: 'M14.856 6H16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.935', stroke: STROKE },
    { d: 'M22 14v-4', stroke: STROKE },
    { d: 'M5.14 18H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2.936', stroke: STROKE },
  ],
  'customer-service': [
    {
      d: 'M3 11h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5Zm0 0a9 9 0 1 1 18 0m0 0v5a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3Z',
      stroke: STROKE,
    },
    { d: 'M21 16v2a4 4 0 0 1-4 4h-5', stroke: STROKE },
  ],
  help: [
    { d: 'M2 12a10 10 0 1 0 20 0a10 10 0 1 0 -20 0z', stroke: STROKE },
    { d: 'M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3', stroke: STROKE },
    { d: 'M12 17h.01', stroke: STROKE },
  ],
  'lost-and-found': [
    { d: 'm21 21-4.34-4.34', stroke: STROKE },
    { d: 'M3 11a8 8 0 1 0 16 0a8 8 0 1 0 -16 0z', stroke: STROKE },
  ],
  lockers: [
    { d: 'M11 16a1 1 0 1 0 2 0a1 1 0 1 0 -2 0z', stroke: STROKE },
    {
      d: 'M5 10h14a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-8a2 2 0 0 1 2 -2z',
      stroke: STROKE,
    },
    { d: 'M7 10V7a5 5 0 0 1 10 0v3', stroke: STROKE },
  ],
  'nursing-room': [
    { d: 'M8 2h8', stroke: STROKE },
    {
      d: 'M9 2v2.789a4 4 0 0 1-.672 2.219l-.656.984A4 4 0 0 0 7 10.212V20a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-9.789a4 4 0 0 0-.672-2.219l-.656-.984A4 4 0 0 1 15 4.788V2',
      stroke: STROKE,
    },
    { d: 'M7 15a6.472 6.472 0 0 1 5 0 6.47 6.47 0 0 0 5 0', stroke: STROKE },
  ],
  'drinking-water': [
    {
      d: 'M5.116 4.104A1 1 0 0 1 6.11 3h11.78a1 1 0 0 1 .994 1.105L17.19 20.21A2 2 0 0 1 15.2 22H8.8a2 2 0 0 1-2-1.79z',
      stroke: STROKE,
    },
    { d: 'M6 12a5 5 0 0 1 6 0 5 5 0 0 0 6 0', stroke: STROKE },
  ],
  trash: [
    { d: 'M10 11v6', stroke: STROKE },
    { d: 'M14 11v6', stroke: STROKE },
    { d: 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6', stroke: STROKE },
    { d: 'M3 6h18', stroke: STROKE },
    { d: 'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2', stroke: STROKE },
  ],
  recycling: [
    {
      d: 'M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5',
      stroke: STROKE,
    },
    {
      d: 'M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12',
      stroke: STROKE,
    },
    { d: 'm14 16-3 3 3 3', stroke: STROKE },
    { d: 'M8.293 13.596 7.196 9.5 3.1 10.598', stroke: STROKE },
    {
      d: 'm9.344 5.811 1.093-1.892A1.83 1.83 0 0 1 11.985 3a1.784 1.784 0 0 1 1.546.888l3.943 6.843',
      stroke: STROKE,
    },
    { d: 'm13.378 9.633 4.096 1.098 1.097-4.096', stroke: STROKE },
  ],
  'smoking-area': [
    { d: 'M17 12H3a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h14', stroke: STROKE },
    { d: 'M18 8c0-2.5-2-2.5-2-5', stroke: STROKE },
    { d: 'M21 16a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1', stroke: STROKE },
    { d: 'M22 8c0-2.5-2-2.5-2-5', stroke: STROKE },
    { d: 'M7 12v4', stroke: STROKE },
  ],
  shower: [
    { d: 'm4 4 2.5 2.5', stroke: STROKE },
    { d: 'M13.5 6.5a4.95 4.95 0 0 0-7 7', stroke: STROKE },
    { d: 'M15 5 5 15', stroke: STROKE },
    { d: 'M14 17v.01', stroke: STROKE },
    { d: 'M10 16v.01', stroke: STROKE },
    { d: 'M13 13v.01', stroke: STROKE },
    { d: 'M16 10v.01', stroke: STROKE },
    { d: 'M11 20v.01', stroke: STROKE },
    { d: 'M17 14v.01', stroke: STROKE },
    { d: 'M20 11v.01', stroke: STROKE },
  ],
  'post-office': [
    { d: 'm22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7', stroke: STROKE },
    {
      d: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-16a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2z',
      stroke: STROKE,
    },
  ],
  'money-changer': [
    {
      d: 'M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-16a2 2 0 0 1 -2 -2v-8a2 2 0 0 1 2 -2z',
      stroke: STROKE,
    },
    { d: 'M10 12a2 2 0 1 0 4 0a2 2 0 1 0 -4 0z', stroke: STROKE },
    { d: 'M6 12h.01M18 12h.01', stroke: STROKE },
  ],
  bank: [
    { d: 'M10 18v-7', stroke: STROKE },
    {
      d: 'M11.119 2.205a2 2 0 0 1 1.762 0l7.84 3.846A.5.5 0 0 1 20.5 7h-17a.5.5 0 0 1-.22-.949z',
      stroke: STROKE,
    },
    { d: 'M14 18v-7', stroke: STROKE },
    { d: 'M18 18v-7', stroke: STROKE },
    { d: 'M3 22h18', stroke: STROKE },
    { d: 'M6 18v-7', stroke: STROKE },
  ],
  cashier: [
    {
      d: 'M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-16a2 2 0 0 1 -2 -2v-10a2 2 0 0 1 2 -2z',
      stroke: STROKE,
    },
    { d: 'M2 10L22 10', stroke: STROKE },
    { d: 'M6 14h2', stroke: STROKE },
  ],
  'ticket-office': [
    {
      d: 'M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z',
      stroke: STROKE,
    },
    { d: 'M13 5v2', stroke: STROKE },
    { d: 'M13 17v2', stroke: STROKE },
    { d: 'M13 11v2', stroke: STROKE },
  ],
  directory: [
    {
      d: 'M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z',
      stroke: STROKE,
    },
    { d: 'M15 5.764v15', stroke: STROKE },
    { d: 'M9 3.236v15', stroke: STROKE },
  ],
  'meeting-point': [
    {
      d: 'M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528',
      stroke: STROKE,
    },
  ],
  reception: [
    { d: 'M3 20a1 1 0 0 1-1-1v-1a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1Z', stroke: STROKE },
    { d: 'M20 16a8 8 0 1 0-16 0', stroke: STROKE },
    { d: 'M12 4v4', stroke: STROKE },
    { d: 'M10 4h4', stroke: STROKE },
  ],
  chapel: [
    { d: 'M10 9h4', stroke: STROKE },
    { d: 'M12 7v5', stroke: STROKE },
    { d: 'M14 21v-3a2 2 0 0 0-4 0v3', stroke: STROKE },
    {
      d: 'm18 9 3.52 2.147a1 1 0 0 1 .48.854V19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6.999a1 1 0 0 1 .48-.854L6 9',
      stroke: STROKE,
    },
    {
      d: 'M6 21V7a1 1 0 0 1 .376-.782l5-3.999a1 1 0 0 1 1.249.001l5 4A1 1 0 0 1 18 7v14',
      stroke: STROKE,
    },
  ],
  'umbrella-storage': [
    { d: 'M12 13v7a2 2 0 0 0 4 0', stroke: STROKE },
    { d: 'M12 2v2', stroke: STROKE },
    {
      d: 'M20.992 13a1 1 0 0 0 .97-1.274 10.284 10.284 0 0 0-19.923 0A1 1 0 0 0 3 13z',
      stroke: STROKE,
    },
  ],
  printing: [
    {
      d: 'M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2',
      stroke: STROKE,
    },
    { d: 'M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6', stroke: STROKE },
    {
      d: 'M7 14h10a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-10a1 1 0 0 1 -1 -1v-6a1 1 0 0 1 1 -1z',
      stroke: STROKE,
    },
  ],
  'opening-hours': [
    { d: 'M2 12a10 10 0 1 0 20 0a10 10 0 1 0 -20 0z', stroke: STROKE },
    { d: 'M12 6v6l4 2', stroke: STROKE },
  ],
  'waiting-area': [
    { d: 'M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3', stroke: STROKE },
    {
      d: 'M3 16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v1.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V11a2 2 0 0 0-4 0z',
      stroke: STROKE,
    },
    { d: 'M5 18v2', stroke: STROKE },
    { d: 'M19 18v2', stroke: STROKE },
  ],
  telephone: [
    {
      d: 'M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384',
      stroke: STROKE,
    },
  ],
  hotel: [
    { d: 'M10 22v-6.57', stroke: STROKE },
    { d: 'M12 11h.01', stroke: STROKE },
    { d: 'M12 7h.01', stroke: STROKE },
    { d: 'M14 15.43V22', stroke: STROKE },
    { d: 'M15 16a5 5 0 0 0-6 0', stroke: STROKE },
    { d: 'M16 11h.01', stroke: STROKE },
    { d: 'M16 7h.01', stroke: STROKE },
    { d: 'M8 11h.01', stroke: STROKE },
    { d: 'M8 7h.01', stroke: STROKE },
    {
      d: 'M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-16a2 2 0 0 1 2 -2z',
      stroke: STROKE,
    },
  ],
  laundry: [
    { d: 'M3 6h3', stroke: STROKE },
    { d: 'M17 6h.01', stroke: STROKE },
    {
      d: 'M5 2h14a2 2 0 0 1 2 2v16a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-16a2 2 0 0 1 2 -2z',
      stroke: STROKE,
    },
    { d: 'M7 13a5 5 0 1 0 10 0a5 5 0 1 0 -10 0z', stroke: STROKE },
    { d: 'M12 18a2.5 2.5 0 0 0 0-5 2.5 2.5 0 0 1 0-5', stroke: STROKE },
  ],
  'bicycle-parking': [
    { d: 'M15 17.5a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0 -7 0z', stroke: STROKE },
    { d: 'M2 17.5a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0 -7 0z', stroke: STROKE },
    { d: 'M14 5a1 1 0 1 0 2 0a1 1 0 1 0 -2 0z', stroke: STROKE },
    { d: 'M12 17.5V14l-3-3 4-3 2 3h2', stroke: STROKE },
  ],
  'motorcycle-parking': [
    { d: 'm18 14-1-3', stroke: STROKE },
    { d: 'm3 9 6 2a2 2 0 0 1 2-2h2a2 2 0 0 1 1.99 1.81', stroke: STROKE },
    { d: 'M8 17h3a1 1 0 0 0 1-1 6 6 0 0 1 6-6 1 1 0 0 0 1-1v-.75A5 5 0 0 0 17 5', stroke: STROKE },
    { d: 'M16 17a3 3 0 1 0 6 0a3 3 0 1 0 -6 0z', stroke: STROKE },
    { d: 'M2 17a3 3 0 1 0 6 0a3 3 0 1 0 -6 0z', stroke: STROKE },
  ],
  car: [
    {
      d: 'M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2',
      stroke: STROKE,
    },
    { d: 'M5 17a2 2 0 1 0 4 0a2 2 0 1 0 -4 0z', stroke: STROKE },
    { d: 'M9 17h6', stroke: STROKE },
    { d: 'M15 17a2 2 0 1 0 4 0a2 2 0 1 0 -4 0z', stroke: STROKE },
  ],
  'drop-off': [
    {
      d: 'm21 8-2 2-1.5-3.7A2 2 0 0 0 15.646 5H8.4a2 2 0 0 0-1.903 1.257L5 10 3 8',
      stroke: STROKE,
    },
    { d: 'M7 14h.01', stroke: STROKE },
    { d: 'M17 14h.01', stroke: STROKE },
    {
      d: 'M5 10h14a2 2 0 0 1 2 2v4a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-4a2 2 0 0 1 2 -2z',
      stroke: STROKE,
    },
    { d: 'M5 18v2', stroke: STROKE },
    { d: 'M19 18v2', stroke: STROKE },
  ],
  taxi: [
    { d: 'M10 2h4', stroke: STROKE },
    {
      d: 'm21 8-2 2-1.5-3.7A2 2 0 0 0 15.646 5H8.4a2 2 0 0 0-1.903 1.257L5 10 3 8',
      stroke: STROKE,
    },
    { d: 'M7 14h.01', stroke: STROKE },
    { d: 'M17 14h.01', stroke: STROKE },
    {
      d: 'M5 10h14a2 2 0 0 1 2 2v4a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-4a2 2 0 0 1 2 -2z',
      stroke: STROKE,
    },
    { d: 'M5 18v2', stroke: STROKE },
    { d: 'M19 18v2', stroke: STROKE },
  ],
  bus: [
    { d: 'M8 6v6', stroke: STROKE },
    { d: 'M15 6v6', stroke: STROKE },
    { d: 'M2 12h19.6', stroke: STROKE },
    {
      d: 'M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3',
      stroke: STROKE,
    },
    { d: 'M5 18a2 2 0 1 0 4 0a2 2 0 1 0 -4 0z', stroke: STROKE },
    { d: 'M9 18h5', stroke: STROKE },
    { d: 'M14 18a2 2 0 1 0 4 0a2 2 0 1 0 -4 0z', stroke: STROKE },
  ],
  shuttle: [
    { d: 'M4 6 2 7', stroke: STROKE },
    { d: 'M10 6h4', stroke: STROKE },
    { d: 'm22 7-2-1', stroke: STROKE },
    {
      d: 'M6 3h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2z',
      stroke: STROKE,
    },
    { d: 'M4 11h16', stroke: STROKE },
    { d: 'M8 15h.01', stroke: STROKE },
    { d: 'M16 15h.01', stroke: STROKE },
    { d: 'M6 19v2', stroke: STROKE },
    { d: 'M18 21v-2', stroke: STROKE },
  ],
  train: [
    { d: 'M8 3.1V7a4 4 0 0 0 8 0V3.1', stroke: STROKE },
    { d: 'm9 15-1-1', stroke: STROKE },
    { d: 'm15 15 1-1', stroke: STROKE },
    { d: 'M9 19c-2.8 0-5-2.2-5-5v-4a8 8 0 0 1 16 0v4c0 2.8-2.2 5-5 5Z', stroke: STROKE },
    { d: 'm8 19-2 3', stroke: STROKE },
    { d: 'm16 19 2 3', stroke: STROKE },
  ],
  tram: [
    {
      d: 'M6 3h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2z',
      stroke: STROKE,
    },
    { d: 'M4 11h16', stroke: STROKE },
    { d: 'M12 3v8', stroke: STROKE },
    { d: 'm8 19-2 3', stroke: STROKE },
    { d: 'm18 22-2-3', stroke: STROKE },
    { d: 'M8 15h.01', stroke: STROKE },
    { d: 'M16 15h.01', stroke: STROKE },
  ],
  departures: [
    { d: 'M2 22h20', stroke: STROKE },
    {
      d: 'M6.36 17.4 4 17l-2-4 1.1-.55a2 2 0 0 1 1.8 0l.17.1a2 2 0 0 0 1.8 0L8 12 5 6l.9-.45a2 2 0 0 1 2.09.2l4.02 3a2 2 0 0 0 2.1.2l4.19-2.06a2.41 2.41 0 0 1 1.73-.17L21 7a1.4 1.4 0 0 1 .87 1.99l-.38.76c-.23.46-.6.84-1.07 1.08L7.58 17.2a2 2 0 0 1-1.22.18Z',
      stroke: STROKE,
    },
  ],
  arrivals: [
    { d: 'M2 22h20', stroke: STROKE },
    {
      d: 'M3.77 10.77 2 9l2-4.5 1.1.55c.55.28.9.84.9 1.45s.35 1.17.9 1.45L8 8.5l3-6 1.05.53a2 2 0 0 1 1.09 1.52l.72 5.4a2 2 0 0 0 1.09 1.52l4.4 2.2c.42.22.78.55 1.01.96l.6 1.03c.49.88-.06 1.98-1.06 2.1l-1.18.15c-.47.06-.95-.02-1.37-.24L4.29 11.15a2 2 0 0 1-.52-.38Z',
      stroke: STROKE,
    },
  ],
  airport: [
    {
      d: 'M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z',
      stroke: STROKE,
    },
  ],
  ferry: [
    { d: 'M12 2v2', stroke: STROKE },
    { d: 'M12 9.189V13', stroke: STROKE },
    { d: 'M19 12V6a2 2 0 00-2-2H7a2 2 0 00-2 2v6', stroke: STROKE },
    {
      d: 'M19.38 19A11.6 11.6 0 0021 13l-8.188-3.639a2 2 0 00-1.624 0L3 13.001a11.6 11.6 0 002.81 7.76',
      stroke: STROKE,
    },
    {
      d: 'M2 20c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1s1.2 1 2.5 1c2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1',
      stroke: STROKE,
    },
  ],
  'baggage-claim': [
    { d: 'M22 18H6a2 2 0 0 1-2-2V7a2 2 0 0 0-2-2', stroke: STROKE },
    { d: 'M17 14V4a2 2 0 0 0-2-2h-1a2 2 0 0 0-2 2v10', stroke: STROKE },
    {
      d: 'M9 6h11a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-11a1 1 0 0 1 -1 -1v-6a1 1 0 0 1 1 -1z',
      stroke: STROKE,
    },
    { d: 'M16 20a2 2 0 1 0 4 0a2 2 0 1 0 -4 0z', stroke: STROKE },
    { d: 'M7 20a2 2 0 1 0 4 0a2 2 0 1 0 -4 0z', stroke: STROKE },
  ],
  luggage: [
    { d: 'M6 20a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2', stroke: STROKE },
    { d: 'M8 18V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v14', stroke: STROKE },
    { d: 'M10 20h4', stroke: STROKE },
    { d: 'M14 20a2 2 0 1 0 4 0a2 2 0 1 0 -4 0z', stroke: STROKE },
    { d: 'M6 20a2 2 0 1 0 4 0a2 2 0 1 0 -4 0z', stroke: STROKE },
  ],
  'fuel-station': [
    { d: 'M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 4 0v-6.998a2 2 0 0 0-.59-1.42L18 5', stroke: STROKE },
    { d: 'M14 21V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v16', stroke: STROKE },
    { d: 'M2 21h13', stroke: STROKE },
    { d: 'M3 9h11', stroke: STROKE },
  ],
  'ev-charging': [
    { d: 'M6.3 20.3a2.4 2.4 0 0 0 3.4 0L12 18l-6-6-2.3 2.3a2.4 2.4 0 0 0 0 3.4Z', stroke: STROKE },
    { d: 'm2 22 3-3', stroke: STROKE },
    { d: 'M7.5 13.5 10 11', stroke: STROKE },
    { d: 'M10.5 16.5 13 14', stroke: STROKE },
    { d: 'm18 3-4 4h6l-4 4', stroke: STROKE },
  ],
  'loading-dock': [
    { d: 'M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2', stroke: STROKE },
    { d: 'M15 18H9', stroke: STROKE },
    {
      d: 'M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14',
      stroke: STROKE,
    },
    { d: 'M15 18a2 2 0 1 0 4 0a2 2 0 1 0 -4 0z', stroke: STROKE },
    { d: 'M5 18a2 2 0 1 0 4 0a2 2 0 1 0 -4 0z', stroke: STROKE },
  ],
  immigration: [
    { d: 'M14 13V8.5C14 7 15 7 15 5a3 3 0 0 0-6 0c0 2 1 2 1 3.5V13', stroke: STROKE },
    {
      d: 'M20 15.5a2.5 2.5 0 0 0-2.5-2.5h-11A2.5 2.5 0 0 0 4 15.5V17a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1z',
      stroke: STROKE,
    },
    { d: 'M5 22h14', stroke: STROKE },
  ],
  'security-check': [
    { d: 'M3 7V5a2 2 0 0 1 2-2h2', stroke: STROKE },
    { d: 'M17 3h2a2 2 0 0 1 2 2v2', stroke: STROKE },
    { d: 'M21 17v2a2 2 0 0 1-2 2h-2', stroke: STROKE },
    { d: 'M7 21H5a2 2 0 0 1-2-2v-2', stroke: STROKE },
    { d: 'M7 12h10', stroke: STROKE },
  ],
  restaurant: [
    { d: 'M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2', stroke: STROKE },
    { d: 'M7 2v20', stroke: STROKE },
    { d: 'M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7', stroke: STROKE },
  ],
  'food-court': [
    { d: 'm16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8', stroke: STROKE },
    {
      d: 'M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Zm0 0 7 7',
      stroke: STROKE,
    },
    { d: 'm2.1 21.8 6.4-6.3', stroke: STROKE },
    { d: 'm19 5-7 7', stroke: STROKE },
  ],
  cafe: [
    { d: 'M10 2v2', stroke: STROKE },
    { d: 'M14 2v2', stroke: STROKE },
    {
      d: 'M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1',
      stroke: STROKE,
    },
    { d: 'M6 2v2', stroke: STROKE },
  ],
  drinks: [
    { d: 'm6 8 1.75 12.28a2 2 0 0 0 2 1.72h4.54a2 2 0 0 0 2-1.72L18 8', stroke: STROKE },
    { d: 'M5 8h14', stroke: STROKE },
    { d: 'M7 15a6.47 6.47 0 0 1 5 0 6.47 6.47 0 0 0 5 0', stroke: STROKE },
    { d: 'm12 8 1-6h2', stroke: STROKE },
  ],
  bakery: [
    { d: 'M10.2 18H4.774a1.5 1.5 0 0 1-1.352-.97 11 11 0 0 1 .132-6.487', stroke: STROKE },
    { d: 'M18 10.2V4.774a1.5 1.5 0 0 0-.97-1.352 11 11 0 0 0-6.486.132', stroke: STROKE },
    { d: 'M18 5a4 3 0 0 1 4 3 2 2 0 0 1-2 2 10 10 0 0 0-5.139 1.42', stroke: STROKE },
    { d: 'M5 18a3 4 0 0 0 3 4 2 2 0 0 0 2-2 10 10 0 0 1 1.42-5.14', stroke: STROKE },
    {
      d: 'M8.709 2.554a10 10 0 0 0-6.155 6.155 1.5 1.5 0 0 0 .676 1.626l9.807 5.42a2 2 0 0 0 2.718-2.718l-5.42-9.807a1.5 1.5 0 0 0-1.626-.676',
      stroke: STROKE,
    },
  ],
  'ice-cream': [
    { d: 'm7 11 4.08 10.35a1 1 0 0 0 1.84 0L17 11', stroke: STROKE },
    { d: 'M17 7A5 5 0 0 0 7 7', stroke: STROKE },
    { d: 'M17 7a2 2 0 0 1 0 4H7a2 2 0 0 1 0-4', stroke: STROKE },
  ],
  'cake-shop': [
    { d: 'M16 13H3', stroke: STROKE },
    { d: 'M16 17H3', stroke: STROKE },
    {
      d: 'm7.2 7.9-3.388 2.5A2 2 0 0 0 3 12.01V20a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-8.654c0-2-2.44-6.026-6.44-8.026a1 1 0 0 0-1.082.057L10.4 5.6',
      stroke: STROKE,
    },
    { d: 'M7 7a2 2 0 1 0 4 0a2 2 0 1 0 -4 0z', stroke: STROKE },
  ],
  'fast-food': [
    { d: 'm2.37 11.223 8.372-6.777a2 2 0 0 1 2.516 0l8.371 6.777', stroke: STROKE },
    { d: 'M21 15a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-5.25', stroke: STROKE },
    { d: 'M3 15a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h9', stroke: STROKE },
    { d: 'm6.67 15 6.13 4.6a2 2 0 0 0 2.8-.4l3.15-4.2', stroke: STROKE },
    {
      d: 'M3 11h18a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-18a1 1 0 0 1 -1 -1v-2a1 1 0 0 1 1 -1z',
      stroke: STROKE,
    },
  ],
  pizza: [
    { d: 'm12 14-1 1', stroke: STROKE },
    { d: 'm13.75 18.25-1.25 1.42', stroke: STROKE },
    { d: 'M17.775 5.654a15.68 15.68 0 0 0-12.121 12.12', stroke: STROKE },
    { d: 'M18.8 9.3a1 1 0 0 0 2.1 7.7', stroke: STROKE },
    {
      d: 'M21.964 20.732a1 1 0 0 1-1.232 1.232l-18-5a1 1 0 0 1-.695-1.232A19.68 19.68 0 0 1 15.732 2.037a1 1 0 0 1 1.232.695z',
      stroke: STROKE,
    },
  ],
  noodles: [
    { d: 'M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z', stroke: STROKE },
    { d: 'M7 21h10', stroke: STROKE },
    { d: 'M19.5 12 22 6', stroke: STROKE },
    {
      d: 'M16.25 3c.27.1.8.53.75 1.36-.06.83-.93 1.2-1 2.02-.05.78.34 1.24.73 1.62',
      stroke: STROKE,
    },
    {
      d: 'M11.25 3c.27.1.8.53.74 1.36-.05.83-.93 1.2-.98 2.02-.06.78.33 1.24.72 1.62',
      stroke: STROKE,
    },
    {
      d: 'M6.25 3c.27.1.8.53.75 1.36-.06.83-.93 1.2-1 2.02-.05.78.34 1.24.74 1.62',
      stroke: STROKE,
    },
  ],
  'healthy-food': [
    { d: 'M7 21h10', stroke: STROKE },
    { d: 'M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z', stroke: STROKE },
    {
      d: 'M11.38 12a2.4 2.4 0 0 1-.4-4.77 2.4 2.4 0 0 1 3.2-2.77 2.4 2.4 0 0 1 3.47-.63 2.4 2.4 0 0 1 3.37 3.37 2.4 2.4 0 0 1-1.1 3.7 2.51 2.51 0 0 1 .03 1.1',
      stroke: STROKE,
    },
    { d: 'm13 12 4-4', stroke: STROKE },
    { d: 'M10.9 7.25A3.99 3.99 0 0 0 4 10c0 .73.2 1.41.54 2', stroke: STROKE },
  ],
  chicken: [
    { d: 'M15.4 15.63a7.875 6 135 1 1 6.23-6.23 4.5 3.43 135 0 0-6.23 6.23', stroke: STROKE },
    {
      d: 'm8.29 12.71-2.6 2.6a2.5 2.5 0 1 0-1.65 4.65A2.5 2.5 0 1 0 8.7 18.3l2.59-2.59',
      stroke: STROKE,
    },
  ],
  seafood: [
    {
      d: 'M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 2.54 7 6-.94 3.47-3.44 6-7 6s-7.56-2.53-8.5-6Z',
      stroke: STROKE,
    },
    { d: 'M18 12v.5', stroke: STROKE },
    { d: 'M16 17.93a9.77 9.77 0 0 1 0-11.86', stroke: STROKE },
    {
      d: 'M7 10.67C7 8 5.58 5.97 2.73 5.5c-1 1.5-1 5 .23 6.5-1.24 1.5-1.24 5-.23 6.5C5.58 18.03 7 16 7 13.33',
      stroke: STROKE,
    },
    { d: 'M10.46 7.26C10.2 5.88 9.17 4.24 8 3h5.8a2 2 0 0 1 1.98 1.67l.23 1.4', stroke: STROKE },
    { d: 'm16.01 17.93-.23 1.4A2 2 0 0 1 13.8 21H9.5a5.96 5.96 0 0 0 1.49-3.98', stroke: STROKE },
  ],
  snacks: [
    {
      d: 'M18 8a2 2 0 0 0 0-4 2 2 0 0 0-4 0 2 2 0 0 0-4 0 2 2 0 0 0-4 0 2 2 0 0 0 0 4',
      stroke: STROKE,
    },
    { d: 'M10 22 9 8', stroke: STROKE },
    { d: 'm14 22 1-14', stroke: STROKE },
    {
      d: 'M20 8c.5 0 .9.4.8 1l-2.6 12c-.1.5-.7 1-1.2 1H7c-.6 0-1.1-.4-1.2-1L3.2 9c-.1-.6.3-1 .8-1Z',
      stroke: STROKE,
    },
  ],
  fruit: [
    { d: 'M12 6.528V3a1 1 0 0 1 1-1h0', stroke: STROKE },
    {
      d: 'M18.237 21A15 15 0 0 0 22 11a6 6 0 0 0-10-4.472A6 6 0 0 0 2 11a15.1 15.1 0 0 0 3.763 10 3 3 0 0 0 3.648.648 5.5 5.5 0 0 1 5.178 0A3 3 0 0 0 18.237 21',
      stroke: STROKE,
    },
  ],
  breakfast: [
    { d: 'M8 12.5a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0 -7 0z', stroke: STROKE },
    {
      d: 'M3 8c0-3.5 2.5-6 6.5-6 5 0 4.83 3 7.5 5s5 2 5 6c0 4.5-2.5 6.5-7 6.5-2.5 0-2.5 2.5-6 2.5s-7-2-7-5.5c0-3 1.5-3 1.5-5C3.5 10 3 9 3 8Z',
      stroke: STROKE,
    },
  ],
  kitchen: [
    {
      d: 'M17 21a1 1 0 0 0 1-1v-5.35c0-.457.316-.844.727-1.041a4 4 0 0 0-2.134-7.589 5 5 0 0 0-9.186 0 4 4 0 0 0-2.134 7.588c.411.198.727.585.727 1.041V20a1 1 0 0 0 1 1Z',
      stroke: STROKE,
    },
    { d: 'M6 17h12', stroke: STROKE },
  ],
  shop: [
    { d: 'M15 21v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5', stroke: STROKE },
    {
      d: 'M17.774 10.31a1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.451 0 1.12 1.12 0 0 0-1.548 0 2.5 2.5 0 0 1-3.452 0 1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.77-3.248l2.889-4.184A2 2 0 0 1 7 2h10a2 2 0 0 1 1.653.873l2.895 4.192a2.5 2.5 0 0 1-3.774 3.244',
      stroke: STROKE,
    },
    { d: 'M4 10.95V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.05', stroke: STROKE },
  ],
  shopping: [
    { d: 'M16 10a4 4 0 0 1-8 0', stroke: STROKE },
    { d: 'M3.103 6.034h17.794', stroke: STROKE },
    {
      d: 'M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z',
      stroke: STROKE,
    },
  ],
  supermarket: [
    {
      d: 'm2.05 2.05 1.099-.028a1 1 0 0 1 1.008.815l2.69 14.347A1 1 0 0 0 7.83 18H18',
      stroke: STROKE,
    },
    {
      d: 'M4.563 5h16.435a1 1 0 0 1 .981 1.204l-1.026 6.226A2 2 0 0 1 18.962 14H6.25',
      stroke: STROKE,
    },
    { d: 'M16 20a2 2 0 1 0 4 0a2 2 0 1 0 -4 0z', stroke: STROKE },
    { d: 'M6 20a2 2 0 1 0 4 0a2 2 0 1 0 -4 0z', stroke: STROKE },
  ],
  minimarket: [
    { d: 'm15 11-1 9', stroke: STROKE },
    { d: 'm19 11-4-7', stroke: STROKE },
    { d: 'M2 11h20', stroke: STROKE },
    { d: 'm3.5 11 1.6 7.4a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6l1.7-7.4', stroke: STROKE },
    { d: 'M4.5 15.5h15', stroke: STROKE },
    { d: 'm5 11 4-7', stroke: STROKE },
    { d: 'm9 11 1 9', stroke: STROKE },
  ],
  fashion: [
    {
      d: 'M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z',
      stroke: STROKE,
    },
  ],
  jewelry: [
    { d: 'M10.5 3 8 9l4 13 4-13-2.5-6', stroke: STROKE },
    {
      d: 'M17 3a2 2 0 0 1 1.6.8l3 4a2 2 0 0 1 .013 2.382l-7.99 10.986a2 2 0 0 1-3.247 0l-7.99-10.986A2 2 0 0 1 2.4 7.8l2.998-3.997A2 2 0 0 1 7 3z',
      stroke: STROKE,
    },
    { d: 'M2 9h20', stroke: STROKE },
  ],
  watches: [
    { d: 'M12 10v2.2l1.6 1', stroke: STROKE },
    { d: 'm16.13 7.66-.81-4.05a2 2 0 0 0-2-1.61h-2.68a2 2 0 0 0-2 1.61l-.78 4.05', stroke: STROKE },
    { d: 'm7.88 16.36.8 4a2 2 0 0 0 2 1.61h2.72a2 2 0 0 0 2-1.61l.81-4.05', stroke: STROKE },
    { d: 'M6 12a6 6 0 1 0 12 0a6 6 0 1 0 -12 0z', stroke: STROKE },
  ],
  optician: [
    { d: 'M2 15a4 4 0 1 0 8 0a4 4 0 1 0 -8 0z', stroke: STROKE },
    { d: 'M14 15a4 4 0 1 0 8 0a4 4 0 1 0 -8 0z', stroke: STROKE },
    { d: 'M14 15a2 2 0 0 0-2-2 2 2 0 0 0-2 2', stroke: STROKE },
    { d: 'M2.5 13 5 7c.7-1.3 1.4-2 3-2', stroke: STROKE },
    { d: 'M21.5 13 19 7c-.7-1.3-1.5-2-3-2', stroke: STROKE },
  ],
  electronics: [
    {
      d: 'M18 5a2 2 0 0 1 2 2v8.526a2 2 0 0 0 .212.897l1.068 2.127a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45l1.068-2.127A2 2 0 0 0 4 15.526V7a2 2 0 0 1 2-2z',
      stroke: STROKE,
    },
    { d: 'M20.054 15.987H3.946', stroke: STROKE },
  ],
  'mobile-phones': [
    {
      d: 'M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-16a2 2 0 0 1 2 -2z',
      stroke: STROKE,
    },
    { d: 'M12 18h.01', stroke: STROKE },
  ],
  bookstore: [
    { d: 'M12 5v16', stroke: STROKE },
    {
      d: 'M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z',
      stroke: STROKE,
    },
  ],
  gifts: [
    { d: 'M12 7v14', stroke: STROKE },
    { d: 'M20 11v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8', stroke: STROKE },
    { d: 'M7.5 7a1 1 0 0 1 0-5A4.8 8 0 0 1 12 7a4.8 8 0 0 1 4.5-5 1 1 0 0 1 0 5', stroke: STROKE },
    {
      d: 'M4 7h16a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-16a1 1 0 0 1 -1 -1v-2a1 1 0 0 1 1 -1z',
      stroke: STROKE,
    },
  ],
  florist: [
    { d: 'M9 12a3 3 0 1 0 6 0a3 3 0 1 0 -6 0z', stroke: STROKE },
    {
      d: 'M12 16.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 1 1 4.5 4.5 4.5 4.5 0 1 1-4.5 4.5',
      stroke: STROKE,
    },
    { d: 'M12 7.5V9', stroke: STROKE },
    { d: 'M7.5 12H9', stroke: STROKE },
    { d: 'M16.5 12H15', stroke: STROKE },
    { d: 'M12 16.5V15', stroke: STROKE },
    { d: 'm8 8 1.88 1.88', stroke: STROKE },
    { d: 'M14.12 9.88 16 8', stroke: STROKE },
    { d: 'm8 16 1.88-1.88', stroke: STROKE },
    { d: 'M14.12 14.12 16 16', stroke: STROKE },
  ],
  beauty: [
    {
      d: 'M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z',
      stroke: STROKE,
    },
    { d: 'M20 2v4', stroke: STROKE },
    { d: 'M22 4h-4', stroke: STROKE },
    { d: 'M2 20a2 2 0 1 0 4 0a2 2 0 1 0 -4 0z', stroke: STROKE },
  ],
  salon: [
    { d: 'M3 6a3 3 0 1 0 6 0a3 3 0 1 0 -6 0z', stroke: STROKE },
    { d: 'M8.12 8.12 12 12', stroke: STROKE },
    { d: 'M20 4 8.12 15.88', stroke: STROKE },
    { d: 'M3 18a3 3 0 1 0 6 0a3 3 0 1 0 -6 0z', stroke: STROKE },
    { d: 'M14.8 14.8 20 20', stroke: STROKE },
  ],
  toys: [
    {
      d: 'M4 8h16a1 1 0 0 1 1 1v10a1 1 0 0 1 -1 1h-16a1 1 0 0 1 -1 -1v-10a1 1 0 0 1 1 -1z',
      stroke: STROKE,
    },
    { d: 'M10 8V5c0-.6-.4-1-1-1H6a1 1 0 0 0-1 1v3', stroke: STROKE },
    { d: 'M19 8V5c0-.6-.4-1-1-1h-3a1 1 0 0 0-1 1v3', stroke: STROKE },
  ],
  furniture: [
    { d: 'M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3', stroke: STROKE },
    {
      d: 'M2 16a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v1.5a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5V11a2 2 0 0 0-4 0z',
      stroke: STROKE,
    },
    { d: 'M4 18v2', stroke: STROKE },
    { d: 'M20 18v2', stroke: STROKE },
    { d: 'M12 4v9', stroke: STROKE },
  ],
  hardware: [
    { d: 'm15 12-9.373 9.373a1 1 0 0 1-3.001-3L12 9', stroke: STROKE },
    { d: 'm18 15 4-4', stroke: STROKE },
    {
      d: 'm21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172v-.344a2 2 0 0 0-.586-1.414l-1.657-1.657A6 6 0 0 0 12.516 3H9l1.243 1.243A6 6 0 0 1 12 8.485V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5',
      stroke: STROKE,
    },
  ],
  promotion: [
    { d: 'M19 5L5 19', stroke: STROKE },
    { d: 'M4 6.5a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0z', stroke: STROKE },
    { d: 'M15 17.5a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0z', stroke: STROKE },
  ],
  hospital: [
    { d: 'M12 7v4', stroke: STROKE },
    { d: 'M14 21v-3a2 2 0 0 0-4 0v3', stroke: STROKE },
    { d: 'M14 9h-4', stroke: STROKE },
    {
      d: 'M18 11h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h2',
      stroke: STROKE,
    },
    { d: 'M18 21V5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16', stroke: STROKE },
  ],
  clinic: [
    {
      d: 'M9 2h6a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-6a1 1 0 0 1 -1 -1v-2a1 1 0 0 1 1 -1z',
      stroke: STROKE,
    },
    {
      d: 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2',
      stroke: STROKE,
    },
    { d: 'M9 14h6', stroke: STROKE },
    { d: 'M12 17v-6', stroke: STROKE },
  ],
  pharmacy: [
    { d: 'm10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z', stroke: STROKE },
    { d: 'm8.5 8.5 7 7', stroke: STROKE },
  ],
  'emergency-room': [
    { d: 'M10 10H6', stroke: STROKE },
    { d: 'M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2', stroke: STROKE },
    {
      d: 'M19 18h2a1 1 0 0 0 1-1v-3.28a1 1 0 0 0-.684-.948l-1.923-.641a1 1 0 0 1-.578-.502l-1.539-3.076A1 1 0 0 0 16.382 8H14',
      stroke: STROKE,
    },
    { d: 'M8 8v4', stroke: STROKE },
    { d: 'M9 18h6', stroke: STROKE },
    { d: 'M15 18a2 2 0 1 0 4 0a2 2 0 1 0 -4 0z', stroke: STROKE },
    { d: 'M5 18a2 2 0 1 0 4 0a2 2 0 1 0 -4 0z', stroke: STROKE },
  ],
  laboratory: [
    { d: 'M6 18h8', stroke: STROKE },
    { d: 'M3 22h18', stroke: STROKE },
    { d: 'M14 22a7 7 0 1 0 0-14h-1', stroke: STROKE },
    { d: 'M9 14h2', stroke: STROKE },
    { d: 'M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z', stroke: STROKE },
    { d: 'M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3', stroke: STROKE },
  ],
  'sample-collection': [
    { d: 'M14.5 2v17.5c0 1.4-1.1 2.5-2.5 2.5c-1.4 0-2.5-1.1-2.5-2.5V2', stroke: STROKE },
    { d: 'M8.5 2h7', stroke: STROKE },
    { d: 'M14.5 16h-5', stroke: STROKE },
  ],
  radiology: [
    { d: 'M12 12h.01', stroke: STROKE },
    {
      d: 'M14 15.4641a4 4 0 0 1-4 0L7.52786 19.74597 A 1 1 0 0 0 7.99303 21.16211 10 10 0 0 0 16.00697 21.16211 1 1 0 0 0 16.47214 19.74597z',
      stroke: STROKE,
    },
    {
      d: 'M16 12a4 4 0 0 0-2-3.464l2.472-4.282a1 1 0 0 1 1.46-.305 10 10 0 0 1 4.006 6.94A1 1 0 0 1 21 12z',
      stroke: STROKE,
    },
    {
      d: 'M8 12a4 4 0 0 1 2-3.464L7.528 4.254a1 1 0 0 0-1.46-.305 10 10 0 0 0-4.006 6.94A1 1 0 0 0 3 12z',
      stroke: STROKE,
    },
  ],
  vaccination: [
    { d: 'm18 2 4 4', stroke: STROKE },
    { d: 'm17 7 3-3', stroke: STROKE },
    { d: 'M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5', stroke: STROKE },
    { d: 'm9 11 4 4', stroke: STROKE },
    { d: 'm5 19-3 3', stroke: STROKE },
    { d: 'm14 4 6 6', stroke: STROKE },
  ],
  cardiology: [
    {
      d: 'M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5',
      stroke: STROKE,
    },
    { d: 'M3.22 13H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27', stroke: STROKE },
  ],
  pediatrics: [
    { d: 'M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5', stroke: STROKE },
    { d: 'M15 12h.01', stroke: STROKE },
    {
      d: 'M19.38 6.813A9 9 0 0 1 20.8 10.2a2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1',
      stroke: STROKE,
    },
    { d: 'M9 12h.01', stroke: STROKE },
  ],
  neurology: [
    { d: 'M12 18V5', stroke: STROKE },
    { d: 'M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4', stroke: STROKE },
    { d: 'M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5', stroke: STROKE },
    { d: 'M17.997 5.125a4 4 0 0 1 2.526 5.77', stroke: STROKE },
    { d: 'M18 18a4 4 0 0 0 2-7.464', stroke: STROKE },
    { d: 'M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517', stroke: STROKE },
    { d: 'M6 18a4 4 0 0 1-2-7.464', stroke: STROKE },
    { d: 'M6.003 5.125a4 4 0 0 0-2.526 5.77', stroke: STROKE },
  ],
  ophthalmology: [
    {
      d: 'M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0',
      stroke: STROKE,
    },
    { d: 'M9 12a3 3 0 1 0 6 0a3 3 0 1 0 -6 0z', stroke: STROKE },
  ],
  ent: [
    { d: 'M6 8.5a6.5 6.5 0 1 1 13 0c0 6-6 6-6 10a3.5 3.5 0 1 1-7 0', stroke: STROKE },
    { d: 'M15 8.5a2.5 2.5 0 0 0-5 0v1a2 2 0 1 1 0 4', stroke: STROKE },
  ],
  dental: [
    { d: 'M15 10V9', stroke: STROKE },
    { d: 'M16.472 15a6 6 0 01-8.943 0', stroke: STROKE },
    { d: 'M9 10V9', stroke: STROKE },
    { d: 'M2 12a10 10 0 1 0 20 0a10 10 0 1 0 -20 0z', stroke: STROKE },
  ],
  orthopedics: [
    {
      d: 'M17 10c.7-.7 1.69 0 2.5 0a2.5 2.5 0 1 0 0-5 .5.5 0 0 1-.5-.5 2.5 2.5 0 1 0-5 0c0 .81.7 1.8 0 2.5l-7 7c-.7.7-1.69 0-2.5 0a2.5 2.5 0 0 0 0 5c.28 0 .5.22.5.5a2.5 2.5 0 1 0 5 0c0-.81-.7-1.8 0-2.5Z',
      stroke: STROKE,
    },
  ],
  inpatient: [
    { d: 'M2 4v16', stroke: STROKE },
    { d: 'M2 8h18a2 2 0 0 1 2 2v10', stroke: STROKE },
    { d: 'M2 17h20', stroke: STROKE },
    { d: 'M6 8v9', stroke: STROKE },
  ],
  'patient-registration': [
    { d: 'M13 19a4 4 0 00-8 0', stroke: STROKE },
    { d: 'M16 10h2', stroke: STROKE },
    { d: 'M16 14h2', stroke: STROKE },
    { d: 'M6 12a3 3 0 1 0 6 0a3 3 0 1 0 -6 0z', stroke: STROKE },
    {
      d: 'M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-16a2 2 0 0 1 -2 -2v-10a2 2 0 0 1 2 -2z',
      stroke: STROKE,
    },
  ],
  'blood-donation': [
    {
      d: 'M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z',
      stroke: STROKE,
    },
  ],
  dialysis: [
    {
      d: 'M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z',
      stroke: STROKE,
    },
    {
      d: 'M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97',
      stroke: STROKE,
    },
  ],
  'temperature-check': [{ d: 'M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z', stroke: STROKE }],
  physiotherapy: [
    {
      d: 'M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2',
      stroke: STROKE,
    },
  ],
  stethoscope: [
    { d: 'M11 2v2', stroke: STROKE },
    { d: 'M5 2v2', stroke: STROKE },
    { d: 'M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1', stroke: STROKE },
    { d: 'M8 15a6 6 0 0 0 12 0v-3', stroke: STROKE },
    { d: 'M18 10a2 2 0 1 0 4 0a2 2 0 1 0 -4 0z', stroke: STROKE },
  ],
  classroom: [
    { d: 'M2 3h20', stroke: STROKE },
    { d: 'M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3', stroke: STROKE },
    { d: 'm7 21 5-5 5 5', stroke: STROKE },
  ],
  library: [
    { d: 'm16 6 4 14', stroke: STROKE },
    { d: 'M12 6v14', stroke: STROKE },
    { d: 'M8 8v12', stroke: STROKE },
    { d: 'M4 4v16', stroke: STROKE },
  ],
  'academic-office': [
    {
      d: 'M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z',
      stroke: STROKE,
    },
    { d: 'M22 10v6', stroke: STROKE },
    { d: 'M6 12.5V16a6 3 0 0 0 12 0v-3.5', stroke: STROKE },
  ],
  school: [
    { d: 'M14 21v-3a2 2 0 0 0-4 0v3', stroke: STROKE },
    { d: 'M18 4.933V21', stroke: STROKE },
    { d: 'm4 6 7.106-3.79a2 2 0 0 1 1.788 0L20 6', stroke: STROKE },
    {
      d: 'm6 11-3.52 2.147a1 1 0 0 0-.48.854V19a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a1 1 0 0 0-.48-.853L18 11',
      stroke: STROKE,
    },
    { d: 'M6 4.933V21', stroke: STROKE },
    { d: 'M10 9a2 2 0 1 0 4 0a2 2 0 1 0 -4 0z', stroke: STROKE },
  ],
  'science-lab': [
    {
      d: 'M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2',
      stroke: STROKE,
    },
    { d: 'M6.453 15h11.094', stroke: STROKE },
    { d: 'M8.5 2h7', stroke: STROKE },
  ],
  'computer-lab': [
    {
      d: 'M4 3h16a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-16a2 2 0 0 1 -2 -2v-10a2 2 0 0 1 2 -2z',
      stroke: STROKE,
    },
    { d: 'M8 21L16 21', stroke: STROKE },
    { d: 'M12 17L12 21', stroke: STROKE },
  ],
  'art-studio': [
    {
      d: 'M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z',
      stroke: STROKE,
    },
    { d: 'M13 6.5a0.5 0.5 0 1 0 1 0a0.5 0.5 0 1 0 -1 0z', stroke: STROKE },
    { d: 'M17 10.5a0.5 0.5 0 1 0 1 0a0.5 0.5 0 1 0 -1 0z', stroke: STROKE },
    { d: 'M6 12.5a0.5 0.5 0 1 0 1 0a0.5 0.5 0 1 0 -1 0z', stroke: STROKE },
    { d: 'M8 7.5a0.5 0.5 0 1 0 1 0a0.5 0.5 0 1 0 -1 0z', stroke: STROKE },
  ],
  'music-room': [
    { d: 'M9 18V5l12-2v13', stroke: STROKE },
    { d: 'M3 18a3 3 0 1 0 6 0a3 3 0 1 0 -6 0z', stroke: STROKE },
    { d: 'M15 16a3 3 0 1 0 6 0a3 3 0 1 0 -6 0z', stroke: STROKE },
  ],
  'study-room': [
    { d: 'M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4', stroke: STROKE },
    { d: 'M2 6h4', stroke: STROKE },
    { d: 'M2 10h4', stroke: STROKE },
    { d: 'M2 14h4', stroke: STROKE },
    { d: 'M2 18h4', stroke: STROKE },
    {
      d: 'M21.378 5.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z',
      stroke: STROKE,
    },
  ],
  'faculty-office': [
    { d: 'M7 8a5 5 0 1 0 10 0a5 5 0 1 0 -10 0z', stroke: STROKE },
    { d: 'M20 21a8 8 0 0 0-16 0', stroke: STROKE },
  ],
  auditorium: [
    { d: 'M12 19v3', stroke: STROKE },
    { d: 'M19 10v2a7 7 0 0 1-14 0v-2', stroke: STROKE },
    {
      d: 'M12 2h0a3 3 0 0 1 3 3v7a3 3 0 0 1 -3 3h0a3 3 0 0 1 -3 -3v-7a3 3 0 0 1 3 -3z',
      stroke: STROKE,
    },
  ],
  office: [
    { d: 'M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16', stroke: STROKE },
    {
      d: 'M4 6h16a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-16a2 2 0 0 1 -2 -2v-10a2 2 0 0 1 2 -2z',
      stroke: STROKE,
    },
  ],
  'meeting-room': [
    { d: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', stroke: STROKE },
    { d: 'M16 3.128a4 4 0 0 1 0 7.744', stroke: STROKE },
    { d: 'M22 21v-2a4 4 0 0 0-3-3.87', stroke: STROKE },
    { d: 'M5 7a4 4 0 1 0 8 0a4 4 0 1 0 -8 0z', stroke: STROKE },
  ],
  'video-conference': [
    {
      d: 'm16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5',
      stroke: STROKE,
    },
    {
      d: 'M4 6h10a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-8a2 2 0 0 1 2 -2z',
      stroke: STROKE,
    },
  ],
  workspace: [
    {
      d: 'M10.293 2.293a1 1 0 0 1 1.414 0l2.5 2.5 5.994 1.227a1 1 0 0 1 .506 1.687l-7 7a1 1 0 0 1-1.687-.506l-1.227-5.994-2.5-2.5a1 1 0 0 1 0-1.414z',
      stroke: STROKE,
    },
    { d: 'm14.207 4.793-3.414 3.414', stroke: STROKE },
    { d: 'M3 20a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z', stroke: STROKE },
    { d: 'm9.086 6.5-4.793 4.793a1 1 0 0 0-.18 1.17L7 18', stroke: STROKE },
  ],
  pantry: [
    { d: 'M5 6a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6Z', stroke: STROKE },
    { d: 'M5 10h14', stroke: STROKE },
    { d: 'M15 7v6', stroke: STROKE },
  ],
  archive: [
    {
      d: 'M3 3h18a1 1 0 0 1 1 1v3a1 1 0 0 1 -1 1h-18a1 1 0 0 1 -1 -1v-3a1 1 0 0 1 1 -1z',
      stroke: STROKE,
    },
    { d: 'M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8', stroke: STROKE },
    { d: 'M10 12h4', stroke: STROKE },
  ],
  'server-room': [
    {
      d: 'M4 2h16a2 2 0 0 1 2 2v4a2 2 0 0 1 -2 2h-16a2 2 0 0 1 -2 -2v-4a2 2 0 0 1 2 -2z',
      stroke: STROKE,
    },
    {
      d: 'M4 14h16a2 2 0 0 1 2 2v4a2 2 0 0 1 -2 2h-16a2 2 0 0 1 -2 -2v-4a2 2 0 0 1 2 -2z',
      stroke: STROKE,
    },
    { d: 'M6 6L6.01 6', stroke: STROKE },
    { d: 'M6 18L6.01 18', stroke: STROKE },
  ],
  administration: [
    {
      d: 'M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z',
      stroke: STROKE,
    },
    { d: 'M14 2v5a1 1 0 0 0 1 1h5', stroke: STROKE },
    { d: 'M10 9H8', stroke: STROKE },
    { d: 'M16 13H8', stroke: STROKE },
    { d: 'M16 17H8', stroke: STROKE },
  ],
  finance: [
    {
      d: 'M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-16a2 2 0 0 1 2 -2z',
      stroke: STROKE,
    },
    { d: 'M8 6L16 6', stroke: STROKE },
    { d: 'M16 14L16 18', stroke: STROKE },
    { d: 'M16 10h.01', stroke: STROKE },
    { d: 'M12 10h.01', stroke: STROKE },
    { d: 'M8 10h.01', stroke: STROKE },
    { d: 'M12 14h.01', stroke: STROKE },
    { d: 'M8 14h.01', stroke: STROKE },
    { d: 'M12 18h.01', stroke: STROKE },
    { d: 'M8 18h.01', stroke: STROKE },
  ],
  'human-resources': [
    { d: 'M16 2v2', stroke: STROKE },
    { d: 'M7 21v-2a2 2 0 012-2h6a2 2 0 012 2v2', stroke: STROKE },
    { d: 'M8 2v2', stroke: STROKE },
    { d: 'M9 10a3 3 0 1 0 6 0a3 3 0 1 0 -6 0z', stroke: STROKE },
    {
      d: 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2z',
      stroke: STROKE,
    },
  ],
  'guest-room': [
    { d: 'm11 17 2 2a1 1 0 1 0 3-3', stroke: STROKE },
    {
      d: 'm14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4',
      stroke: STROKE,
    },
    { d: 'm21 3 1 11h-2', stroke: STROKE },
    { d: 'M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3', stroke: STROKE },
    { d: 'M3 4h8', stroke: STROKE },
  ],
  'office-building': [
    { d: 'M10 12h4', stroke: STROKE },
    { d: 'M10 8h4', stroke: STROKE },
    { d: 'M14 21v-3a2 2 0 0 0-4 0v3', stroke: STROKE },
    {
      d: 'M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2',
      stroke: STROKE,
    },
    { d: 'M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16', stroke: STROKE },
  ],
  'access-card': [
    {
      d: 'M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z',
      stroke: STROKE,
    },
    { d: 'M16 7.5a0.5 0.5 0 1 0 1 0a0.5 0.5 0 1 0 -1 0z', stroke: STROKE },
  ],
  'fire-alarm': [
    { d: 'M7 18v-6a5 5 0 1 1 10 0v6', stroke: STROKE },
    { d: 'M5 21a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2z', stroke: STROKE },
    { d: 'M21 12h1', stroke: STROKE },
    { d: 'M18.5 4.5 18 5', stroke: STROKE },
    { d: 'M2 12h1', stroke: STROKE },
    { d: 'M12 2v1', stroke: STROKE },
    { d: 'm4.929 4.929.707.707', stroke: STROKE },
    { d: 'M12 12v6', stroke: STROKE },
  ],
  'smoke-detector': [
    { d: 'M11 21c0-2.5 2-2.5 2-5', stroke: STROKE },
    { d: 'M16 21c0-2.5 2-2.5 2-5', stroke: STROKE },
    { d: 'm19 8-.8 3a1.25 1.25 0 0 1-1.2 1H7a1.25 1.25 0 0 1-1.2-1L5 8', stroke: STROKE },
    { d: 'M21 3a1 1 0 0 1 1 1v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a1 1 0 0 1 1-1z', stroke: STROKE },
    { d: 'M6 21c0-2.5 2-2.5 2-5', stroke: STROKE },
  ],
  'fire-hazard': [
    {
      d: 'M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4',
      stroke: STROKE,
    },
  ],
  'security-post': [
    {
      d: 'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z',
      stroke: STROKE,
    },
    { d: 'm9 12 2 2 4-4', stroke: STROKE },
  ],
  cctv: [
    {
      d: 'M16.75 12h3.632a1 1 0 0 1 .894 1.447l-2.034 4.069a1 1 0 0 1-1.708.134l-2.124-2.97',
      stroke: STROKE,
    },
    {
      d: 'M17.106 9.053a1 1 0 0 1 .447 1.341l-3.106 6.211a1 1 0 0 1-1.342.447L3.61 12.3a2.92 2.92 0 0 1-1.3-3.91L3.69 5.6a2.92 2.92 0 0 1 3.92-1.3z',
      stroke: STROKE,
    },
    { d: 'M2 19h3.76a2 2 0 0 0 1.8-1.1L9 15', stroke: STROKE },
    { d: 'M2 21v-4', stroke: STROKE },
    { d: 'M7 9h.01', stroke: STROKE },
  ],
  ppe: [
    { d: 'M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5', stroke: STROKE },
    { d: 'M14 6a6 6 0 0 1 6 6v3', stroke: STROKE },
    { d: 'M4 15v-3a6 6 0 0 1 6-6', stroke: STROKE },
    {
      d: 'M3 15h18a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-18a1 1 0 0 1 -1 -1v-2a1 1 0 0 1 1 -1z',
      stroke: STROKE,
    },
  ],
  warning: [
    {
      d: 'm21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3',
      stroke: STROKE,
    },
    { d: 'M12 9v4', stroke: STROKE },
    { d: 'M12 17h.01', stroke: STROKE },
  ],
  'high-voltage': [
    {
      d: 'M15.914 4a1.5 1.5 0 00-2.474-1.561l-9 9A1.5 1.5 0 005.5 14h4.002a.5.5 0 01.471.666L8.086 20a1.5 1.5 0 002.475 1.56l9-9A1.5 1.5 0 0018.5 10h-3.997a.5.5 0 01-.472-.667z',
      stroke: STROKE,
    },
  ],
  biohazard: [
    { d: 'M10 11.9a2 2 0 1 0 4 0a2 2 0 1 0 -4 0z', stroke: STROKE },
    { d: 'M6.7 3.4c-.9 2.5 0 5.2 2.2 6.7C6.5 9 3.7 9.6 2 11.6', stroke: STROKE },
    { d: 'm8.9 10.1 1.4.8', stroke: STROKE },
    { d: 'M17.3 3.4c.9 2.5 0 5.2-2.2 6.7 2.4-1.2 5.2-.6 6.9 1.5', stroke: STROKE },
    { d: 'm15.1 10.1-1.4.8', stroke: STROKE },
    { d: 'M16.7 20.8c-2.6-.4-4.6-2.6-4.7-5.3-.2 2.6-2.1 4.8-4.7 5.2', stroke: STROKE },
    { d: 'M12 13.9v1.6', stroke: STROKE },
    { d: 'M13.5 5.4c-1-.2-2-.2-3 0', stroke: STROKE },
    { d: 'M17 16.4c.7-.7 1.2-1.6 1.5-2.5', stroke: STROKE },
    { d: 'M5.5 13.9c.3.9.8 1.8 1.5 2.5', stroke: STROKE },
  ],
  'no-smoking': [
    { d: 'M12 12H3a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h13', stroke: STROKE },
    { d: 'M18 8c0-2.5-2-2.5-2-5', stroke: STROKE },
    { d: 'm2 2 20 20', stroke: STROKE },
    { d: 'M21 12a1 1 0 0 1 1 1v2a1 1 0 0 1-.5.866', stroke: STROKE },
    { d: 'M22 8c0-2.5-2-2.5-2-5', stroke: STROKE },
    { d: 'M7 12v4', stroke: STROKE },
  ],
  'no-entry': [
    { d: 'M2 12a10 10 0 1 0 20 0a10 10 0 1 0 -20 0z', stroke: STROKE },
    { d: 'M4.929 4.929 19.07 19.071', stroke: STROKE },
  ],
  'restricted-area': [
    {
      d: 'M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-7a2 2 0 0 1 2 -2z',
      stroke: STROKE,
    },
    { d: 'M7 11V7a5 5 0 0 1 10 0v4', stroke: STROKE },
  ],
  'emergency-phone': [
    { d: 'M13 2a9 9 0 0 1 9 9', stroke: STROKE },
    { d: 'M13 6a5 5 0 0 1 5 5', stroke: STROKE },
    {
      d: 'M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384',
      stroke: STROKE,
    },
  ],
  aed: [
    {
      d: 'M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5',
      stroke: STROKE,
    },
  ],
  construction: [
    {
      d: 'M3 6h18a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-18a1 1 0 0 1 -1 -1v-6a1 1 0 0 1 1 -1z',
      stroke: STROKE,
    },
    { d: 'M17 14v7', stroke: STROKE },
    { d: 'M7 14v7', stroke: STROKE },
    { d: 'M17 3v3', stroke: STROKE },
    { d: 'M7 3v3', stroke: STROKE },
    { d: 'M10 14 2.3 6.3', stroke: STROKE },
    { d: 'm14 6 7.7 7.7', stroke: STROKE },
    { d: 'm8 6 8 8', stroke: STROKE },
  ],
  'life-buoy': [
    { d: 'M2 12a10 10 0 1 0 20 0a10 10 0 1 0 -20 0z', stroke: STROKE },
    { d: 'm4.93 4.93 4.24 4.24', stroke: STROKE },
    { d: 'm14.83 9.17 4.24-4.24', stroke: STROKE },
    { d: 'm14.83 14.83 4.24 4.24', stroke: STROKE },
    { d: 'm9.17 14.83-4.24 4.24', stroke: STROKE },
    { d: 'M8 12a4 4 0 1 0 8 0a4 4 0 1 0 -8 0z', stroke: STROKE },
  ],
  'evacuation-route': [
    { d: 'M3 19a3 3 0 1 0 6 0a3 3 0 1 0 -6 0z', stroke: STROKE },
    { d: 'M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15', stroke: STROKE },
    { d: 'M15 5a3 3 0 1 0 6 0a3 3 0 1 0 -6 0z', stroke: STROKE },
  ],
  wheelchair: [
    { d: 'M15 4a1 1 0 1 0 2 0a1 1 0 1 0 -2 0z', stroke: STROKE },
    { d: 'm18 19 1-7-6 1', stroke: STROKE },
    { d: 'm5 8 3-3 5.5 3-2.36 3.5', stroke: STROKE },
    { d: 'M4.24 14.5a5 5 0 0 0 6.88 6', stroke: STROKE },
    { d: 'M13.76 17.5a5 5 0 0 0-6.88-6', stroke: STROKE },
  ],
  'hearing-loop': [
    { d: 'M2 10v3', stroke: STROKE },
    { d: 'M6 6v11', stroke: STROKE },
    { d: 'M10 3v18', stroke: STROKE },
    { d: 'M14 8v7', stroke: STROKE },
    { d: 'M18 5v13', stroke: STROKE },
    { d: 'M22 10v3', stroke: STROKE },
  ],
  deaf: [
    { d: 'M6 18.5a3.5 3.5 0 1 0 7 0c0-1.57.92-2.52 2.04-3.46', stroke: STROKE },
    { d: 'M6 8.5c0-.75.13-1.47.36-2.14', stroke: STROKE },
    { d: 'M8.8 3.15A6.5 6.5 0 0 1 19 8.5c0 1.63-.44 2.81-1.09 3.76', stroke: STROKE },
    { d: 'M12.5 6A2.5 2.5 0 0 1 15 8.5M10 13a2 2 0 0 0 1.82-1.18', stroke: STROKE },
    { d: 'M2 2L22 22', stroke: STROKE },
  ],
  blind: [
    {
      d: 'M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49',
      stroke: STROKE,
    },
    { d: 'M14.084 14.158a3 3 0 0 1-4.242-4.242', stroke: STROKE },
    {
      d: 'M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143',
      stroke: STROKE,
    },
    { d: 'm2 2 20 20', stroke: STROKE },
  ],
  'sign-language': [
    { d: 'M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2', stroke: STROKE },
    { d: 'M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2', stroke: STROKE },
    { d: 'M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8', stroke: STROKE },
    {
      d: 'M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15',
      stroke: STROKE,
    },
  ],
  priority: [
    { d: 'M11 5a1 1 0 1 0 2 0a1 1 0 1 0 -2 0z', stroke: STROKE },
    { d: 'm9 20 3-6 3 6', stroke: STROKE },
    { d: 'm6 8 6 2 6-2', stroke: STROKE },
    { d: 'M12 10v4', stroke: STROKE },
  ],
  'guide-dog': [
    { d: 'M11.25 16.25h1.5L12 17z', stroke: STROKE },
    { d: 'M16 14v.5', stroke: STROKE },
    {
      d: 'M4.42 11.247A13.152 13.152 0 0 0 4 14.556C4 18.728 7.582 21 12 21s8-2.272 8-6.444a11.702 11.702 0 0 0-.493-3.309',
      stroke: STROKE,
    },
    { d: 'M8 14v.5', stroke: STROKE },
    {
      d: 'M8.5 8.5c-.384 1.05-1.083 2.028-2.344 2.5-1.931.722-3.576-.297-3.656-1-.113-.994 1.177-6.53 4-7 1.923-.321 3.651.845 3.651 2.235A7.497 7.497 0 0 1 14 5.277c0-1.39 1.844-2.598 3.767-2.277 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.855-1.45-2.239-2.5',
      stroke: STROKE,
    },
  ],
  assistance: [
    {
      d: 'M19.414 14.414C21 12.828 22 11.5 22 9.5a5.5 5.5 0 0 0-9.591-3.676.6.6 0 0 1-.818.001A5.5 5.5 0 0 0 2 9.5c0 2.3 1.5 4 3 5.5l5.535 5.362a2 2 0 0 0 2.879.052 2.12 2.12 0 0 0-.004-3 2.124 2.124 0 1 0 3-3 2.124 2.124 0 0 0 3.004 0 2 2 0 0 0 0-2.828l-1.881-1.882a2.41 2.41 0 0 0-3.409 0l-1.71 1.71a2 2 0 0 1-2.828 0 2 2 0 0 1 0-2.828l2.823-2.762',
      stroke: STROKE,
    },
  ],
  cinema: [
    { d: 'm12.296 3.464 3.02 3.956', stroke: STROKE },
    {
      d: 'M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3z',
      stroke: STROKE,
    },
    { d: 'M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', stroke: STROKE },
    { d: 'm6.18 5.276 3.1 3.899', stroke: STROKE },
  ],
  arcade: [
    { d: 'M6 11L10 11', stroke: STROKE },
    { d: 'M8 9L8 13', stroke: STROKE },
    { d: 'M15 12L15.01 12', stroke: STROKE },
    { d: 'M18 10L18.01 10', stroke: STROKE },
    {
      d: 'M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z',
      stroke: STROKE,
    },
  ],
  karaoke: [
    {
      d: 'm11 7.601-5.994 8.19a1 1 0 0 0 .1 1.298l.817.818a1 1 0 0 0 1.314.087L15.09 12',
      stroke: STROKE,
    },
    {
      d: 'M16.5 21.174C15.5 20.5 14.372 20 13 20c-2.058 0-3.928 2.356-6 2-2.072-.356-2.775-3.369-1.5-4.5',
      stroke: STROKE,
    },
    { d: 'M11 7a5 5 0 1 0 10 0a5 5 0 1 0 -10 0z', stroke: STROKE },
  ],
  gym: [
    {
      d: 'M17.596 12.768a2 2 0 1 0 2.829-2.829l-1.768-1.767a2 2 0 0 0 2.828-2.829l-2.828-2.828a2 2 0 0 0-2.829 2.828l-1.767-1.768a2 2 0 1 0-2.829 2.829z',
      stroke: STROKE,
    },
    { d: 'm2.5 21.5 1.4-1.4', stroke: STROKE },
    { d: 'm20.1 3.9 1.4-1.4', stroke: STROKE },
    {
      d: 'M5.343 21.485a2 2 0 1 0 2.829-2.828l1.767 1.768a2 2 0 1 0 2.829-2.829l-6.364-6.364a2 2 0 1 0-2.829 2.829l1.768 1.767a2 2 0 0 0-2.828 2.829z',
      stroke: STROKE,
    },
    { d: 'm9.6 14.4 4.8-4.8', stroke: STROKE },
  ],
  'swimming-pool': [
    { d: 'M19 5a2 2 0 0 0-2 2v11', stroke: STROKE },
    {
      d: 'M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1',
      stroke: STROKE,
    },
    { d: 'M7 13h10', stroke: STROKE },
    { d: 'M7 9h10', stroke: STROKE },
    { d: 'M9 5a2 2 0 0 0-2 2v11', stroke: STROKE },
  ],
  playground: [
    {
      d: 'M15.39 4.39a1 1 0 0 0 1.68-.474 2.5 2.5 0 1 1 3.014 3.015 1 1 0 0 0-.474 1.68l1.683 1.682a2.414 2.414 0 0 1 0 3.414L19.61 15.39a1 1 0 0 1-1.68-.474 2.5 2.5 0 1 0-3.014 3.015 1 1 0 0 1 .474 1.68l-1.683 1.682a2.414 2.414 0 0 1-3.414 0L8.61 19.61a1 1 0 0 0-1.68.474 2.5 2.5 0 1 1-3.014-3.015 1 1 0 0 0 .474-1.68l-1.683-1.682a2.414 2.414 0 0 1 0-3.414L4.39 8.61a1 1 0 0 1 1.68.474 2.5 2.5 0 1 0 3.014-3.015 1 1 0 0 1-.474-1.68l1.683-1.682a2.414 2.414 0 0 1 3.414 0z',
      stroke: STROKE,
    },
  ],
  park: [
    { d: 'M10 10v.2A3 3 0 0 1 8.9 16H5a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z', stroke: STROKE },
    { d: 'M7 16v6', stroke: STROKE },
    { d: 'M13 19v3', stroke: STROKE },
    {
      d: 'M12 19h8.3a1 1 0 0 0 .7-1.7L18 14h.3a1 1 0 0 0 .7-1.7L16 9h.2a1 1 0 0 0 .8-1.7L13 3l-1.4 1.5',
      stroke: STROKE,
    },
  ],
  garden: [
    {
      d: 'M12 5a3 3 0 1 1 3 3m-3-3a3 3 0 1 0-3 3m3-3v1M9 8a3 3 0 1 0 3 3M9 8h1m5 0a3 3 0 1 1-3 3m3-3h-1m-2 3v-1',
      stroke: STROKE,
    },
    { d: 'M10 8a2 2 0 1 0 4 0a2 2 0 1 0 -4 0z', stroke: STROKE },
    { d: 'M12 10v12', stroke: STROKE },
    { d: 'M12 22c4.2 0 7-1.667 7-5-4.2 0-7 1.667-7 5Z', stroke: STROKE },
    { d: 'M12 22c-4.2 0-7-1.667-7-5 4.2 0 7 1.667 7 5Z', stroke: STROKE },
  ],
  theater: [
    { d: 'M10 11h.01', stroke: STROKE },
    { d: 'M14 6h.01', stroke: STROKE },
    { d: 'M18 6h.01', stroke: STROKE },
    { d: 'M6.5 13.1h.01', stroke: STROKE },
    { d: 'M22 5c0 9-4 12-6 12s-6-3-6-12c0-2 2-3 6-3s6 1 6 3', stroke: STROKE },
    { d: 'M17.4 9.9c-.8.8-2 .8-2.8 0', stroke: STROKE },
    {
      d: 'M10.1 7.1C9 7.2 7.7 7.7 6 8.6c-3.5 2-4.7 3.9-3.7 5.6 4.5 7.8 9.5 8.4 11.2 7.4.9-.5 1.9-2.1 1.9-4.7',
      stroke: STROKE,
    },
    { d: 'M9.1 16.5c.3-1.1 1.4-1.7 2.4-1.4', stroke: STROKE },
  ],
  gallery: [
    {
      d: 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2z',
      stroke: STROKE,
    },
    { d: 'M7 9a2 2 0 1 0 4 0a2 2 0 1 0 -4 0z', stroke: STROKE },
    { d: 'm21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21', stroke: STROKE },
  ],
  'photo-spot': [
    {
      d: 'M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z',
      stroke: STROKE,
    },
    { d: 'M9 13a3 3 0 1 0 6 0a3 3 0 1 0 -6 0z', stroke: STROKE },
  ],
  event: [
    { d: 'M5.8 11.3 2 22l10.7-3.79', stroke: STROKE },
    { d: 'M4 3h.01', stroke: STROKE },
    { d: 'M22 8h.01', stroke: STROKE },
    { d: 'M15 2h.01', stroke: STROKE },
    { d: 'M22 20h.01', stroke: STROKE },
    {
      d: 'm22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10',
      stroke: STROKE,
    },
    { d: 'm22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11c-.11.7-.72 1.22-1.43 1.22H17', stroke: STROKE },
    { d: 'm11 2 .33.82c.34.86-.2 1.82-1.11 1.98C9.52 4.9 9 5.52 9 6.23V7', stroke: STROKE },
    {
      d: 'M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2Z',
      stroke: STROKE,
    },
  ],
  'sports-field': [
    { d: 'M11 7a16 16 20 0 1 10.98 4.362', stroke: STROKE },
    { d: 'M12 12a13 13 0 0 1-8.66 5', stroke: STROKE },
    { d: 'M16.83 13.634a16 16 0 0 1-9.267 7.328', stroke: STROKE },
    { d: 'M20.66 17A13 13 0 0 0 12 12a13 13 0 0 1 0-10', stroke: STROKE },
    { d: 'M8.17 15.366a16 16 0 0 1-1.713-11.69', stroke: STROKE },
    { d: 'M2 12a10 10 0 1 0 20 0a10 10 0 1 0 -20 0z', stroke: STROKE },
  ],
  'live-music': [
    { d: 'm11.9 12.1 4.514-4.514', stroke: STROKE },
    {
      d: 'M20.1 2.3a1 1 0 0 0-1.4 0l-1.114 1.114A2 2 0 0 0 17 4.828v1.344a2 2 0 0 1-.586 1.414A2 2 0 0 1 17.828 7h1.344a2 2 0 0 0 1.414-.586L21.7 5.3a1 1 0 0 0 0-1.4z',
      stroke: STROKE,
    },
    { d: 'm6 16 2 2', stroke: STROKE },
    {
      d: 'M8.23 9.85A3 3 0 0 1 11 8a5 5 0 0 1 5 5 3 3 0 0 1-1.85 2.77l-.92.38A2 2 0 0 0 12 18a4 4 0 0 1-4 4 6 6 0 0 1-6-6 4 4 0 0 1 4-4 2 2 0 0 0 1.85-1.23z',
      stroke: STROKE,
    },
  ],
  'pet-area': [
    { d: 'M9 4a2 2 0 1 0 4 0a2 2 0 1 0 -4 0z', stroke: STROKE },
    { d: 'M16 8a2 2 0 1 0 4 0a2 2 0 1 0 -4 0z', stroke: STROKE },
    { d: 'M18 16a2 2 0 1 0 4 0a2 2 0 1 0 -4 0z', stroke: STROKE },
    {
      d: 'M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z',
      stroke: STROKE,
    },
  ],
  'amusement-ride': [
    { d: 'M10 12a2 2 0 1 0 4 0a2 2 0 1 0 -4 0z', stroke: STROKE },
    { d: 'M12 2v4', stroke: STROKE },
    { d: 'm6.8 15-3.5 2', stroke: STROKE },
    { d: 'm20.7 7-3.5 2', stroke: STROKE },
    { d: 'M6.8 9 3.3 7', stroke: STROKE },
    { d: 'm20.7 17-3.5-2', stroke: STROKE },
    { d: 'm9 22 3-8 3 8', stroke: STROKE },
    { d: 'M8 22h8', stroke: STROKE },
    { d: 'M18 18.7a9 9 0 1 0-12 0', stroke: STROKE },
  ],
  entrance: [
    { d: 'M10 21H2', stroke: STROKE },
    { d: 'M10 3H7a2 2 0 00-2 2v16', stroke: STROKE },
    { d: 'M14 12h.01', stroke: STROKE },
    {
      d: 'M19 21V5a2 2 0 00-1.675-1.974l-6.163-1.013A1 1 0 0010 3v18a1 1 0 001.124.992z',
      stroke: STROKE,
    },
    { d: 'M22 21h-3', stroke: STROKE },
  ],
  exit: [
    { d: 'm16 17 5-5-5-5', stroke: STROKE },
    { d: 'M21 12H9', stroke: STROKE },
    { d: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', stroke: STROKE },
  ],
  door: [
    { d: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16', stroke: STROKE },
    { d: 'M2 21h20', stroke: STROKE },
    { d: 'M9 12h.01', stroke: STROKE },
  ],
  warehouse: [
    { d: 'M18 21V10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v11', stroke: STROKE },
    {
      d: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 1.132-1.803l7.95-3.974a2 2 0 0 1 1.837 0l7.948 3.974A2 2 0 0 1 22 8z',
      stroke: STROKE,
    },
    { d: 'M6 13h12', stroke: STROKE },
    { d: 'M6 17h12', stroke: STROKE },
  ],
  'production-area': [
    { d: 'M12 16h.01', stroke: STROKE },
    { d: 'M16 16h.01', stroke: STROKE },
    {
      d: 'M3 19a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5a.5.5 0 0 0-.769-.422l-4.462 2.844A.5.5 0 0 1 15 10.5v-2a.5.5 0 0 0-.769-.422L9.77 10.922A.5.5 0 0 1 9 10.5V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z',
      stroke: STROKE,
    },
    { d: 'M8 16h.01', stroke: STROKE },
  ],
  forklift: [
    { d: 'M12 12H5a2 2 0 0 0-2 2v5', stroke: STROKE },
    { d: 'M15 19h7', stroke: STROKE },
    { d: 'M16 19V2', stroke: STROKE },
    {
      d: 'M6 12V7a2 2 0 0 1 2-2h2.172a2 2 0 0 1 1.414.586l3.828 3.828A2 2 0 0 1 16 10.828',
      stroke: STROKE,
    },
    { d: 'M7 19h4', stroke: STROKE },
    { d: 'M11 19a2 2 0 1 0 4 0a2 2 0 1 0 -4 0z', stroke: STROKE },
    { d: 'M3 19a2 2 0 1 0 4 0a2 2 0 1 0 -4 0z', stroke: STROKE },
  ],
  container: [
    {
      d: 'M22 7.7c0-.6-.4-1.2-.8-1.5l-6.3-3.9a1.72 1.72 0 0 0-1.7 0l-10.3 6c-.5.2-.9.8-.9 1.4v6.6c0 .5.4 1.2.8 1.5l6.3 3.9a1.72 1.72 0 0 0 1.7 0l10.3-6c.5-.3.9-1 .9-1.5Z',
      stroke: STROKE,
    },
    { d: 'M10 21.9V14L2.1 9.1', stroke: STROKE },
    { d: 'm10 14 11.9-6.9', stroke: STROKE },
    { d: 'M14 19.8v-8.1', stroke: STROKE },
    { d: 'M18 17.5V9.4', stroke: STROKE },
  ],
  parcels: [
    {
      d: 'M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z',
      stroke: STROKE,
    },
    { d: 'M12 22V12', stroke: STROKE },
    { d: 'M3.29 7L12 12L20.71 7', stroke: STROKE },
    { d: 'm7.5 4.27 9 5.15', stroke: STROKE },
  ],
  'power-outlet': [
    { d: 'M12 22v-5', stroke: STROKE },
    { d: 'M15 8V2', stroke: STROKE },
    { d: 'M17 8a1 1 0 0 1 1 1v4a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1z', stroke: STROKE },
    { d: 'M9 8V2', stroke: STROKE },
  ],
  ventilation: [
    {
      d: 'M10.827 16.379a6.082 6.082 0 0 1-8.618-7.002l5.412 1.45a6.082 6.082 0 0 1 7.002-8.618l-1.45 5.412a6.082 6.082 0 0 1 8.618 7.002l-5.412-1.45a6.082 6.082 0 0 1-7.002 8.618l1.45-5.412Z',
      stroke: STROKE,
    },
    { d: 'M12 12v.01', stroke: STROKE },
  ],
  maintenance: [
    {
      d: 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z',
      stroke: STROKE,
    },
  ],
  'utility-room': [
    { d: 'M11 10.27 7 3.34', stroke: STROKE },
    { d: 'm11 13.73-4 6.93', stroke: STROKE },
    { d: 'M12 22v-2', stroke: STROKE },
    { d: 'M12 2v2', stroke: STROKE },
    { d: 'M14 12h8', stroke: STROKE },
    { d: 'm17 20.66-1-1.73', stroke: STROKE },
    { d: 'm17 3.34-1 1.73', stroke: STROKE },
    { d: 'M2 12h2', stroke: STROKE },
    { d: 'm20.66 17-1.73-1', stroke: STROKE },
    { d: 'm20.66 7-1.73 1', stroke: STROKE },
    { d: 'm3.34 17 1.73-1', stroke: STROKE },
    { d: 'm3.34 7 1.73 1', stroke: STROKE },
    { d: 'M10 12a2 2 0 1 0 4 0a2 2 0 1 0 -4 0z', stroke: STROKE },
    { d: 'M4 12a8 8 0 1 0 16 0a8 8 0 1 0 -16 0z', stroke: STROKE },
  ],
  bathroom: [
    { d: 'M10 4 8 6', stroke: STROKE },
    { d: 'M17 19v2', stroke: STROKE },
    { d: 'M2 12h20', stroke: STROKE },
    { d: 'M7 19v2', stroke: STROKE },
    {
      d: 'M9 5 7.621 3.621A2.121 2.121 0 0 0 4 5v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5',
      stroke: STROKE,
    },
  ],
  'key-handover': [
    { d: 'm2 21 9.6-9.6', stroke: STROKE },
    { d: 'm7.5 15.5 2.3 2.3a1 1 0 0 1 0 1.4l-2.1 2.1a1 1 0 0 1-1.4 0L4 19', stroke: STROKE },
    { d: 'M10 7.5a5.5 5.5 0 1 0 11 0a5.5 5.5 0 1 0 -11 0z', stroke: STROKE },
  ],
  mailbox: [
    {
      d: 'M22 17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.5C2 7 4 5 6.5 5H18c2.2 0 4 1.8 4 4v8Z',
      stroke: STROKE,
    },
    { d: 'M15 9L18 9L18 11', stroke: STROKE },
    { d: 'M6.5 5C9 5 11 7 11 9.5V17a2 2 0 0 1-2 2', stroke: STROKE },
    { d: 'M6 10L7 10', stroke: STROKE },
  ],
  'outdoor-area': [
    { d: 'M8 12a4 4 0 1 0 8 0a4 4 0 1 0 -8 0z', stroke: STROKE },
    { d: 'M12 2v2', stroke: STROKE },
    { d: 'M12 20v2', stroke: STROKE },
    { d: 'm4.93 4.93 1.41 1.41', stroke: STROKE },
    { d: 'm17.66 17.66 1.41 1.41', stroke: STROKE },
    { d: 'M2 12h2', stroke: STROKE },
    { d: 'M20 12h2', stroke: STROKE },
    { d: 'm6.34 17.66-1.41 1.41', stroke: STROKE },
    { d: 'm19.07 4.93-1.41 1.41', stroke: STROKE },
  ],
  building: [
    { d: 'M12 10h.01', stroke: STROKE },
    { d: 'M12 14h.01', stroke: STROKE },
    { d: 'M12 6h.01', stroke: STROKE },
    { d: 'M16 10h.01', stroke: STROKE },
    { d: 'M16 14h.01', stroke: STROKE },
    { d: 'M16 6h.01', stroke: STROKE },
    { d: 'M8 10h.01', stroke: STROKE },
    { d: 'M8 14h.01', stroke: STROKE },
    { d: 'M8 6h.01', stroke: STROKE },
    { d: 'M9 22v-3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3', stroke: STROKE },
    {
      d: 'M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-16a2 2 0 0 1 2 -2z',
      stroke: STROKE,
    },
  ],
  directions: [
    { d: 'M12 13v8', stroke: STROKE },
    { d: 'M12 3v3', stroke: STROKE },
    {
      d: 'M2.354 10.354a1.207 1.207 0 0 1 0-1.708l2.06-2.06A2 2 0 0 1 5.828 6h12.344a2 2 0 0 1 1.414.586l2.06 2.06a1.207 1.207 0 0 1 0 1.708l-2.06 2.06a2 2 0 0 1-1.414.586H5.828a2 2 0 0 1-1.414-.586z',
      stroke: STROKE,
    },
  ],
};
