import {AlgorithmWorkerStepType, MessageType, PlaybackDirection, StepFunction} from "../constants/types";
import {getGridData, heuristics, gridSize} from "../store";
import {elementsData} from "../constants";
import Noty from "noty";
import {get, Writable, writable} from "svelte/store";
import {clamp} from "./index";

function highlightElement(element: Element) {
    element.classList.add('cell--highlighted');
    setTimeout(() => element.classList.remove('cell--highlighted'), 200);
}

function stepForward(element: Element, type: AlgorithmWorkerStepType) {
    highlightElement(element);
    switch (type) {
        case AlgorithmWorkerStepType.VISIT: {
            return element.classList.add('cell--visited');
        }
        case AlgorithmWorkerStepType.DISCOVER: {
            return element.classList.add('cell--discovered');
        }
        case AlgorithmWorkerStepType.MARK_PATH: {
            return element.classList.add('cell--path');
        }
    }
}

function stepBackward(element: Element, type: AlgorithmWorkerStepType) {
    highlightElement(element);
    switch (type) {
        case AlgorithmWorkerStepType.VISIT: {
            return element.classList.remove('cell--visited');
        }
        case AlgorithmWorkerStepType.DISCOVER: {
            return element.classList.remove('cell--discovered');
        }
        case AlgorithmWorkerStepType.MARK_PATH: {
            return element.classList.remove('cell--path');
        }
    }
}

function createGridPaintMove(element: Element, type: AlgorithmWorkerStepType, direction: PlaybackDirection) {
    switch (direction) {
        case PlaybackDirection.FORWARD:
            return stepForward(element, type);
        case PlaybackDirection.BACKWARD:
            return stepBackward(element, type);
    }
}

function showMissingDataToast() {
    const gridData = getGridData();
    const missingData = [];
    for (const data in gridData) {
        if (gridData[data].length === 0) missingData.push(`${elementsData[data].text} ${elementsData[data].icon} `);
    }
    new Noty({
        type: 'error',
        layout: 'bottom',
        text: `Cannot process algorithm, following data is missing: ${missingData.join(', ')}`
    }).show();
}

function canProcessData() {
    const gridData = getGridData();
    return (gridData.walls.length !== 0 && gridData.start.length !== 0 && gridData.end.length !== 0);
}

const STEP_SIZE = 10;

export default class Painter {
    public _currentStep = writable(0);
    public _interval = writable(undefined);
    public worker: Worker;
    public _steps: Writable<Array<StepFunction>> = writable([]);
    constructor(worker) {
        this.worker = worker;
        heuristics.subscribe(() => {
            this.reset();
        })
    }
    get currentStep(): number {
        return get(this._currentStep);
    }

    get interval(): number {
        return get(this._interval);
    }

    set currentStep(index: number) {
        this._currentStep.set(index);
    }

    get steps(): Array<StepFunction> {
        return get(this._steps);
    }

    get isPlaying(): boolean {
       return this.interval !== undefined;
    }

    get totalNumberOfSteps(): number {
        return this.steps.length;
    }

    public addStep = step => {

        const { location, type } = step;
        const element = document.getElementById(String(location));
        this._steps.update(s => [...s, direction => createGridPaintMove(element, type, direction)]);
        if (this.steps.length > 20000) this.worker.terminate();
        if (!this.interval) this.startVisualizingSteps();
    };

    public startVisualizingSteps = () => {
        if (!canProcessData()) {
            showMissingDataToast();
        } else if (this.totalNumberOfSteps === 0) {
            this.startProcessingData();
        } else {
            this.startPlaying();
        }
    };

    private startProcessingData = () => {
        const {nrOfColumns, nrOfRows} = get(gridSize);
        this.worker.postMessage([MessageType.GRID_DATA, {
            width: nrOfColumns,
            height: nrOfRows,
            ...getGridData(),
            heuristics: get(heuristics),
        }]);
    };

    public reset = () => {
        this._steps.set([]);
        this.currentStep = 0;
    };

    private removeInterval() {
        clearInterval(this.interval);
        this._interval.set(undefined);
    }

    private queueForwardSteps(nrOfSteps = STEP_SIZE) {
        const start = this.currentStep;
        for (let i = start; i < start + nrOfSteps; i++) {
            setTimeout(() => this.steps[i](PlaybackDirection.FORWARD), 0);
        }
    }

    private queueBackwardsSteps(nrOfSteps = STEP_SIZE) {
        const start = this.currentStep;
        for (let i = start; i > start + nrOfSteps; i--) {
            setTimeout(() => {
                if (!this.steps[i]) debugger;
                this.steps[i](PlaybackDirection.BACKWARD);
            }, 0);
        }
    }

    public skipBackward = () => {
        const nrOfSteps = clamp(-STEP_SIZE, -this.currentStep, 0)
        this.queueBackwardsSteps(nrOfSteps);
        this.currentStep = this.currentStep + nrOfSteps;
    };

    public skipForward = () => {
        const nrOfSteps = clamp(STEP_SIZE, 0, (this.steps.length - 1) - this.currentStep)
        this.queueForwardSteps(nrOfSteps);
        this.currentStep = this.currentStep + nrOfSteps;
    };

    public onManualLoaderChange = e => {
        this.removeInterval();
        const value = parseInt(e.detail.target.value, 10);
        const nrOfSteps = value - this.currentStep;
        const direction = nrOfSteps > 0 ? PlaybackDirection.FORWARD : PlaybackDirection.BACKWARD;
        if (direction === PlaybackDirection.FORWARD) this.queueForwardSteps(nrOfSteps)
        else if (direction === PlaybackDirection.BACKWARD) this.queueBackwardsSteps(nrOfSteps);
        this.currentStep = value;
    };

    public stopPlaying = () => {
        if (this.interval === undefined) return;
        clearInterval(this.interval);
        this._interval.set(null);
    };

    public startPlaying = () => {
        this._interval.set(setInterval(() => {
            if (this.currentStep >= this.totalNumberOfSteps - 1) {
                this.removeInterval();
                return;
            }
            const stepToExecute = this.steps[this.currentStep++];
            stepToExecute(PlaybackDirection.FORWARD);
        }, 20));
    }

}