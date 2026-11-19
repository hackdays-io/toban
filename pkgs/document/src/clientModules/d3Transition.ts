// Mermaid's flowchart tooltips call `selection.transition()`, which exists only
// once d3-transition has been evaluated. mermaid reaches it through `d3`, whose
// package.json declares `"sideEffects": false`, so webpack drops the module and
// hovering a node throws "transition is not a function". Importing it here keeps
// it in the bundle.
import "d3-transition";
