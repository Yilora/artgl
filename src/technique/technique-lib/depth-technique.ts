import { Technique } from "../../core/technique";
import { GLDataType } from "../../webgl/shader-util";
import { AttributeUsage } from "../../webgl/attribute";
import { Matrix4 } from "../../math/matrix4";
import { InnerSupportUniform } from "../../webgl/uniform/uniform";

const vertexShaderSource =
  `
    void main() {
      vec4 worldPosition = VPMatrix * MMatrix * vec4(position, 1.0);
      depth = worldPosition.z / worldPosition.w;
      gl_Position = worldPosition;
    }
    `
const fragmentShaderSource =
  `
  
    vec4 PackDepth(in float frag_depth) {
      vec4 bitSh = vec4(256.0 * 256.0 * 256.0, 256.0 * 256.0, 256.0, 1.0);
      vec4 bitMsk = vec4(0.0, 1.0 / 256.0, 1.0 / 256.0, 1.0 / 256.0);
      vec4 enc = fract(frag_depth * bitSh);
      enc -= enc.xxyz * bitMsk;
      return enc;
    }

    float UnpackDepth( const in vec4 enc ) {
        const vec4 bit_shift = vec4( 1.0 / ( 256.0 * 256.0 * 256.0 ), 1.0 / ( 256.0 * 256.0 ), 1.0 / 256.0, 1.0 );
        float decoded = dot( enc, bit_shift );
        return decoded;
    }

    void main() {
      gl_FragColor = PackDepth(depth);
    }
    `

export class DepthTechnique extends Technique {
  constructor() {
    const config = {
      programConfig: {
        attributes: [
          { name: 'position', type: GLDataType.floatVec3, usage: AttributeUsage.position, stride: 3 },
        ],
        uniformsIncludes: [
          { name: 'MMatrix', mapInner: InnerSupportUniform.MMatrix,},
          { name: 'VPMatrix', mapInner: InnerSupportUniform.VPMatrix,}
        ],
        varyings: [
          { name: 'depth', type: GLDataType.float }
        ],
        vertexShaderString: vertexShaderSource,
        fragmentShaderString: fragmentShaderSource,
        autoInjectHeader: true,
      }
    }
    super(config);
  }

}