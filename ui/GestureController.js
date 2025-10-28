export class GestureController {
    constructor(targetElement, threshold = 28) {
        this.targetElement = targetElement;
        this.threshold = threshold;
        this.callbacks = [];
        this.enabled = true;
        this.touchIdentifier = null;
        this.startPoint = null;
        this.lastPoint = null;

        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);

        if (this.targetElement) {
            this.attach();
        }
    }

    attach() {
        this.targetElement.addEventListener('touchstart', this.handleTouchStart, { passive: false });
        this.targetElement.addEventListener('touchmove', this.handleTouchMove, { passive: false });
        this.targetElement.addEventListener('touchend', this.handleTouchEnd, { passive: false });
        this.targetElement.addEventListener('touchcancel', this.handleTouchEnd, { passive: false });
    }

    onDirection(callback) {
        this.callbacks.push(callback);
    }

    setEnabled(isEnabled) {
        this.enabled = isEnabled;
        if (!isEnabled) {
            this.reset();
        }
    }

    handleTouchStart(event) {
        if (!this.enabled || event.touches.length === 0) {
            return;
        }
        const touch = event.touches[0];
        this.touchIdentifier = touch.identifier;
        this.startPoint = { x: touch.clientX, y: touch.clientY };
        this.lastPoint = { x: touch.clientX, y: touch.clientY };
    }

    handleTouchMove(event) {
        if (!this.enabled || this.touchIdentifier === null) {
            return;
        }
        const touch = this.findTouch(event.touches, this.touchIdentifier);
        if (!touch) {
            return;
        }
        this.lastPoint = { x: touch.clientX, y: touch.clientY };
        const deltaX = this.lastPoint.x - this.startPoint.x;
        const deltaY = this.lastPoint.y - this.startPoint.y;
        if (Math.abs(deltaX) > this.threshold || Math.abs(deltaY) > this.threshold) {
            event.preventDefault();
        }
    }

    handleTouchEnd(event) {
        if (!this.enabled || this.touchIdentifier === null) {
            this.reset();
            return;
        }
        const touch = this.findTouch(event.changedTouches, this.touchIdentifier);
        if (!touch) {
            this.reset();
            return;
        }

        const endPoint = { x: touch.clientX, y: touch.clientY };
        const deltaX = endPoint.x - this.startPoint.x;
        const deltaY = endPoint.y - this.startPoint.y;
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);
        const distance = Math.max(absX, absY);

        if (distance >= this.threshold) {
            const direction = this.resolveDirection(deltaX, deltaY);
            if (direction) {
                this.emit(direction);
            }
        }
        this.reset();
    }

    resolveDirection(deltaX, deltaY) {
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);
        if (absX > absY) {
            return deltaX > 0 ? 'right' : 'left';
        }
        if (absY > absX) {
            return deltaY > 0 ? 'down' : 'up';
        }
        return null;
    }

    emit(direction) {
        for (let index = 0; index < this.callbacks.length; index += 1) {
            this.callbacks[index](direction);
        }
    }

    findTouch(touchList, identifier) {
        for (let index = 0; index < touchList.length; index += 1) {
            const touch = touchList[index];
            if (touch.identifier === identifier) {
                return touch;
            }
        }
        return null;
    }

    reset() {
        this.touchIdentifier = null;
        this.startPoint = null;
        this.lastPoint = null;
    }
}
