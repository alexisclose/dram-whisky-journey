export type Whisky = {
  id: number;
  distillery: string;
  name: string;
  region: string;
  abv: number;
  lat: number;
  lng: number;
};

export const WHISKIES: Whisky[] = [
  { id: 1, distillery: "Glenfiddich", name: "12 Year Old", region: "Speyside", abv: 40, lat: 57.455, lng: -3.128 },
  { id: 2, distillery: "Lagavulin", name: "16 Year Old", region: "Islay", abv: 43, lat: 55.635, lng: -6.126 },
  { id: 3, distillery: "Highland Park", name: "12 Viking Honour", region: "Islands", abv: 40, lat: 58.967, lng: -2.959 },
  { id: 4, distillery: "Macallan", name: "Sherry Oak 12", region: "Speyside", abv: 40, lat: 57.484, lng: -3.213 },
  { id: 5, distillery: "Oban", name: "14 Year Old", region: "Highland", abv: 43, lat: 56.415, lng: -5.473 },
  { id: 6, distillery: "Talisker", name: "10 Year Old", region: "Islands", abv: 45.8, lat: 57.302, lng: -6.356 },
  { id: 7, distillery: "Ardbeg", name: "Uigeadail", region: "Islay", abv: 54.2, lat: 55.646, lng: -6.110 },
  { id: 8, distillery: "Glenmorangie", name: "Original 10", region: "Highland", abv: 40, lat: 57.282, lng: -4.044 },
  { id: 9, distillery: "Laphroaig", name: "10 Year Old", region: "Islay", abv: 40, lat: 55.630, lng: -6.152 },
  { id: 10, distillery: "Balvenie", name: "DoubleWood 12", region: "Speyside", abv: 40, lat: 57.448, lng: -3.128 },
  { id: 11, distillery: "Springbank", name: "10 Year Old", region: "Campbeltown", abv: 46, lat: 55.425, lng: -5.607 },
  { id: 12, distillery: "Auchentoshan", name: "American Oak", region: "Lowland", abv: 40, lat: 55.922, lng: -4.409 },
];
