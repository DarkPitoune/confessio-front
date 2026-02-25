import "leaflet";
declare module "leaflet" {
  interface Map {
    setActiveArea(
      cssClassOrStyles: string | Partial<CSSStyleDeclaration>,
      recenter?: boolean,
      animate?: boolean,
    ): this;
  }
}
