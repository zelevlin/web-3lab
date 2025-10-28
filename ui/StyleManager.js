const STYLES = `
:root {
    font-family: 'Segoe UI', Roboto, Arial, sans-serif;
    background-color: #faf8ef;
    color: #3c3a32;
}

body {
    margin: 0;
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: stretch;
}

.game-root {
    flex: 1 1 auto;
    max-width: 540px;
    padding: 24px 20px 48px 20px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.game-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.game-title {
    margin: 0;
    font-size: 32px;
    letter-spacing: 1px;
}

.score-panel {
    display: flex;
    gap: 12px;
}

.score-panel__box {
    background-color: #bbada0;
    color: #fff;
    padding: 12px 18px;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 96px;
}

.score-panel__label {
    font-size: 12px;
    text-transform: uppercase;
    opacity: 0.8;
}

.score-panel__value {
    font-size: 22px;
    font-weight: 600;
}

.board-wrapper {
    display: flex;
    justify-content: center;
}

.board {
    position: relative;
    width: min(100%, 420px);
    aspect-ratio: 1;
    background-color: #bbada0;
    border-radius: 16px;
    padding: var(--grid-gap);
    box-sizing: border-box;
    --grid-gap: 12px;
    --grid-size: 4;
}

.board-grid {
    width: 100%;
    height: 100%;
    display: grid;
    grid-template-columns: repeat(var(--grid-size), 1fr);
    grid-template-rows: repeat(var(--grid-size), 1fr);
    gap: var(--grid-gap);
}

.board-grid__cell {
    background-color: rgba(238, 228, 218, 0.35);
    border-radius: 12px;
}

.tile-layer {
    position: absolute;
    top: var(--grid-gap);
    left: var(--grid-gap);
    right: var(--grid-gap);
    bottom: var(--grid-gap);
    pointer-events: none;
}

.tile {
    position: absolute;
    width: calc((100% - var(--grid-gap) * (var(--grid-size) - 1)) / var(--grid-size));
    height: calc((100% - var(--grid-gap) * (var(--grid-size) - 1)) / var(--grid-size));
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 28px;
    transition: transform 0.18s ease-out, background-color 0.15s ease-in-out;
    will-change: transform;
    z-index: 2;
    transform: translate(var(--tile-x, 0px), var(--tile-y, 0px)) scale(var(--tile-scale, 1));
}

.tile--ghost {
    z-index: 1;
    opacity: 0.95;
}

.tile--new {
    animation: tile-pop 0.18s ease;
}

.tile--merged {
    animation: tile-merge 0.22s ease;
}

.tile__value {
    pointer-events: none;
}

@keyframes tile-pop {
    0% { transform: translate(var(--tile-x, 0px), var(--tile-y, 0px)) scale(0.6); }
    100% { transform: translate(var(--tile-x, 0px), var(--tile-y, 0px)) scale(1); }
}

@keyframes tile-merge {
    0% { transform: translate(var(--tile-x, 0px), var(--tile-y, 0px)) scale(1); }
    50% { transform: translate(var(--tile-x, 0px), var(--tile-y, 0px)) scale(1.05); }
    100% { transform: translate(var(--tile-x, 0px), var(--tile-y, 0px)) scale(1); }
}

.control-panel {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.control-panel[data-hidden="true"] {
    display: none;
}

.control-panel__actions {
    display: flex;
    gap: 12px;
}

.control-panel__button {
    flex: 1 1 auto;
    padding: 12px 16px;
    border-radius: 8px;
    border: none;
    background-color: #8f7a66;
    color: #fff;
    font-size: 16px;
    cursor: pointer;
    transition: background-color 0.2s ease;
}

.control-panel__button:disabled,
.control-panel[data-disabled="true"] .control-panel__button {
    background-color: #cfc1b2;
    cursor: default;
}

.control-panel__button:not(:disabled):hover {
    background-color: #9f8b76;
}

.dialog-overlay {
    position: fixed;
    inset: 0;
    background-color: rgba(51, 51, 51, 0.65);
    display: none;
    align-items: center;
    justify-content: center;
    padding: 24px;
    box-sizing: border-box;
    z-index: 10;
}

.dialog-overlay--visible {
    display: flex;
}

.dialog {
    background-color: #faf8ef;
    padding: 24px;
    border-radius: 16px;
    max-width: 360px;
    width: 100%;
    box-sizing: border-box;
    display: none;
    flex-direction: column;
    gap: 16px;
}

.dialog--visible {
    display: flex;
}

.dialog__title {
    margin: 0;
    font-size: 24px;
}

.dialog__message {
    font-size: 16px;
    line-height: 1.4;
}

.dialog__input {
    padding: 10px 14px;
    font-size: 16px;
    border-radius: 8px;
    border: 1px solid #cfc1b2;
}

.dialog__actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
}

.dialog__button {
    padding: 10px 14px;
    border-radius: 8px;
    border: none;
    background-color: #8f7a66;
    color: #fff;
    font-size: 16px;
    cursor: pointer;
}

.dialog__button:disabled {
    background-color: #cfc1b2;
    cursor: default;
}

.dialog__table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
}

.dialog__table thead {
    text-align: left;
}

.dialog__table th,
.dialog__table td {
    padding: 6px 4px;
}

.dialog__table tbody tr:nth-child(even) {
    background-color: transparent;
}

.dialog__empty {
    font-size: 14px;
    opacity: 0.7;
}

@media (max-width: 768px) {
    .game-root {
        padding: 16px;
        gap: 16px;
    }
    .game-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
    }
    .score-panel {
        width: 100%;
        justify-content: space-between;
    }
    .board {
        width: 100%;
        padding: 12px;
    }
}
`;

export class StyleManager {
    constructor() {
        this.isInjected = false;
    }

    inject() {
        if (this.isInjected) {
            return;
        }
        const styleElement = document.createElement('style');
        styleElement.setAttribute('data-origin', 'game-2048-styles');
        styleElement.textContent = STYLES;
        document.head.appendChild(styleElement);
        this.isInjected = true;
    }
}
