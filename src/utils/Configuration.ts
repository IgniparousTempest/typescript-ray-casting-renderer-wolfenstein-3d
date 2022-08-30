export type RendererTypes = 'solid' | 'shaded' | 'textured';

export interface Configuration {
    showMapCoordinates: boolean;
    selectedRenderer: RendererTypes;
}
