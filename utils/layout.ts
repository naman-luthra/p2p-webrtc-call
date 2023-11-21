/**
 * Calculates the maximum area in a line based on the given parameters.
 * @param n - The number of elements in the line.
 * @param w - The width of the line.
 * @param h - The height of the line.
 * @returns An object containing the calculated values:
 *   - elementWidth: The width of each element.
 *   - elementHeight: The height of each element.
 *   - area: The maximum area of the line.
 *   - margin: An object containing the x and y margins.
 */
function calcMaxAreaInLine(n: number,w: number,h: number){
    if(w/(n*h)>16/9)
        return {
            elementWidth: h*16/9,
            elementHeight: h,
            area: (h*h*16)/(9),
            margin: {
                x: w - (h*16*n)/9,
                y: 0
            }
        };
    else
        return {
            elementWidth: w/n,
            elementHeight: (w*9)/(n*16),
            area: (w*w*9)/(16*n*n),
            margin: {
                x: w - (h*16*n)/9,
                y: h - (w*9)/(16*n)
            }
        };
}


/**
 * Calculates the positions of elements in a layout.
 * 
 * @param n - The number of elements.
 * @param sl - The starting left position.
 * @param st - The starting top position.
 * @param ew - The element width.
 * @param w - The total width of the layout.
 * @returns An array of objects representing the positions of the elements.
 */
function calcPositions(n: number, sl: number, st: number, ew: number, w:number){
    const res = [];
    const margin = w-ew*n;
    let pl = sl + margin/2;
    for(let i=0; i<n; i++){
        res.push({
            top: st,
            left: pl
        });
        pl += ew;
    }
    return res;
}

/**
 * Calculates the best layout for a given number of elements in a container with specified width and height.
 * 
 * @param n - The number of elements.
 * @param w - The width of the container.
 * @param h - The height of the container.
 * @returns An object containing the element width, element height, and coordinates of each element in the layout.
 */
export default function createLayout(n:number,w:number,h:number){
    let bestLayout={
        rows:1,
        ...calcMaxAreaInLine(n,w,h)
    }
    for(let rows=2; rows<=n; rows++){
        const elementsPerRow = Math.ceil(n/rows);
        const newCalc = calcMaxAreaInLine(
            elementsPerRow,
            w,
            h/rows
        );
        if(newCalc.area>bestLayout.area){
            bestLayout = {
                rows,
                ...newCalc
            }
        }
    }
    let elementsRemaining = n;
    const coordinates = [];
    const elementsPerRow = Math.ceil(n/bestLayout.rows);
    const containerCoordinates = {
        left: bestLayout.margin.x/2,
        top: bestLayout.margin.y/2
    }
    for(let row=0; row<bestLayout.rows; row++){
        const elements = Math.min(elementsPerRow, elementsRemaining);
        elementsRemaining -= elements;
        coordinates.push(
            ...calcPositions(
                elements,
                containerCoordinates.left,
                containerCoordinates.top + bestLayout.elementHeight*row,
                bestLayout.elementWidth,
                w-bestLayout.margin.x
            )
        );
    }
    return {
        elementWidth: bestLayout.elementWidth,
        elementHeight: bestLayout.elementHeight,
        coordinates
    };
}