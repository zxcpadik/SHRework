
export class FIFOBuffer {
   private buffer: Buffer;
   private high: number;
   private head: number;
   private tail: number;

   constructor(max_size?: number) {
      if (!max_size)
         max_size = 1024 * 1024;

      this.buffer = Buffer.alloc(max_size);
      this.high = max_size;
      this.head = this.tail = 0;
   }

   // append copy of  _buffer. If size() + _buffer.length > max_size, enq returns false, otherwise true.
   enq(buffer: Buffer): boolean {
      const n = buffer.length;
      if (this.size + n > this.high)
         return false;
      if (this.high - this.tail < n) { // enough space but clustered, make current = 0
         this.buffer.copy(this.buffer, 0, this.head, this.tail);
         this.tail -= this.head;
         this.head = 0;
      }
      buffer.copy(this.buffer, this.tail);
      this.tail += n;
      return true;
   }

   // return first n bytes, returns null if less bytes are available
   // _peekonly opional and private use from peek().
   deq(nbytes: number = 0, _peekonly? : boolean): Buffer | null {
      if (nbytes > this.size)
         return null;
      let ret_buf = Buffer.alloc(nbytes);
      this.buffer.copy(ret_buf, 0, this.head, this.head + nbytes);
      if (_peekonly)
         return ret_buf;
      this.head += nbytes;
      if (this.size == 0) { // if tail == head we can jump to 0 again
         this.head = this.tail = 0;
      }
      return ret_buf;
   }

   // returns a copy of nbytes from current start of buffer, or null if less bytes available
   peek(nbytes: number): Buffer | null {
      return this.deq(nbytes, true);
   }

   // same as deq(size)
   drain(): Buffer | null {
      return this.deq(this.size);
   }
   // Returns n bytes available in buffer
   get size(): number {
      return this.tail - this.head;
   }
}