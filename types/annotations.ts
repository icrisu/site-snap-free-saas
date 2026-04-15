export interface BaseAnnotation {
	id: string;
	pageIndex: number;
	x: number;
	y: number;
	rotation?: number;
}

export interface TextAnnotation extends BaseAnnotation {
	type: "text";
	text: string;
	fontSize: number;
	fill: string;
	bold: boolean;
}

export interface RectAnnotation extends BaseAnnotation {
	type: "rect";
	width: number;
	height: number;
	fill: string;
	stroke: string;
	strokeWidth: number;
}

export interface EllipseAnnotation extends BaseAnnotation {
	type: "ellipse";
	radiusX: number;
	radiusY: number;
	fill: string;
	stroke: string;
	strokeWidth: number;
}

export interface ArrowAnnotation extends BaseAnnotation {
	type: "arrow";
	points: number[];
	stroke: string;
	strokeWidth: number;
}

export interface DrawAnnotation extends BaseAnnotation {
	type: "draw";
	points: number[];
	stroke: string;
	strokeWidth: number;
}

export type Annotation =
	| TextAnnotation
	| RectAnnotation
	| EllipseAnnotation
	| ArrowAnnotation
	| DrawAnnotation;

export type ToolType = "select" | "text" | "rect" | "ellipse" | "arrow" | "draw";

export type AnnotationAction =
	| { type: "ADD"; annotation: Annotation }
	| { type: "UPDATE"; annotation: Annotation }
	| { type: "DELETE"; id: string; pageIndex: number }
	| { type: "DELETE_PAGE"; pageIndex: number }
	| { type: "SET_ALL"; annotations: Map<number, Annotation[]> }
	| { type: "REORDER"; pageIndex: number; annotationIds: string[] };

export interface PageDimensions {
	displayWidth: number;
	displayHeight: number;
	pdfWidth: number;
	pdfHeight: number;
}
