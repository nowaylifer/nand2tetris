import { createCB, create } from "xmlbuilder2";
import { Transform, type TransformCallback } from "stream";
import type { XMLBuilderCB } from "xmlbuilder2/lib/interfaces.js";

export default class XMLTransform extends Transform {
  private xmlBuilder: XMLBuilderCB;

  constructor({ root = "root", prettyPrint = false, declaration = false } = {}) {
    super({ objectMode: true });

    this.xmlBuilder = createCB({
      data: (text: string) => this.push(text),
      prettyPrint,
    });

    if (declaration) {
      this.xmlBuilder.dec({ encoding: "UTF-8" });
    }

    this.xmlBuilder.ele(root);
  }

  override _transform(obj: object, _encoding: BufferEncoding, done: TransformCallback) {
    this.xmlBuilder.ele(obj);
    done();
  }

  override _flush(done: TransformCallback) {
    this.xmlBuilder.up().end();
    done();
  }
}
