class ListNode {
    constructor(value) {
        this.value = value;
        this.prev = null;
        this.next = null;
    }

    remove() {
        if (this.prev)
            this.prev.next = this.next;
        if (this.next)
            this.next.prev = this.prev;
        return this.value;
    }
}

class List {
    constructor() {
        this.head = null;
        this.tail = null;
        this.size = 0;
    }

    enqueue(value) {
        this.push(value);
    }

    dequeue() {
        if (this.size <= 0)
            return null;
        const node = this.tail;
        if (this.tail)
            this.tail = this.tail.prev;
        if (this.size === 1)
            this.head = this.head.next;
        if (this.size > 0)
            this.size--;
        return node.value;
    }

    push(value) {
        this.size++;
        const node = new ListNode(value);
        node.next = this.head;
        this.head = node;
        if (this.tail === null)
            this.tail = node;
        return node;
    }

    pop() {
        if (this.size <= 0)
            return null;
        const node = this.head;
        this.head = node.next;
        if (this.tail === node)
            this.tail = null;
        if (this.size > 0)
            this.size--;
        if (node)
            return node.value;
        return null;
    }

    remove(node) {
        if (this.head === node)
            this.head = node.next;
        if (this.tail === node)
            this.tail = node.prev;
        if (this.size > 0)
            this.size--;
        return node.remove();
    }

    get(k, node) {
        let tmp;
        if (k < this.size / 2) {
            tmp = this.head;
            let i = 0;
            while (tmp !== null && i < k) {
                tmp = tmp.next;
                i++;
            }
            if (tmp === null)
                return null;
        } else {
            tmp = this.tail;
            let i = this.size - 1;
            while (tmp !== null && i > k) {
                tmp = tmp.prev;
                i--;
            }
            if (tmp === null)
                return null;
        }

        if (node)
            return tmp;
        return tmp.value;
    }

    toArray(order = -1) {
        const arr = [];
        if (order <= 0) {
            let tmp = this.head;
            while (tmp !== null) {
                arr.push(tmp.value);
                tmp = tmp.next;
            }
            return arr;
        }
        let tmp = this.tail;
        while (tmp !== null) {
            arr.push(tmp.value);
            tmp = tmp.prev;
        }
        return arr;
    }
}

module.exports = {
    List,
    ListNode,
};
