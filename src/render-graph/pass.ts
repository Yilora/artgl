import { GLFramebuffer } from "../webgl/gl-framebuffer";
import { ARTEngine, RenderSource } from "../engine/render-engine";
import { Technique } from "../core/technique";
import { RenderGraph } from "./render-graph";
import { PassDefine } from "./interface";
import { TextureNode } from "./dag/texture-node";
import { Vector4 } from "../math/vector4";

export class RenderPass{
  constructor(graph: RenderGraph, define: PassDefine) {
    this.graph = graph;
    this.define = define;
    this.name = define.name;
    if (define.technique !== undefined) {
      const overrideTechnique = graph.getResgisteredTechnique(define.technique);
      if (overrideTechnique === undefined) {
        throw `technique '${define.technique}' not defined`
      }
      this.overrideTechnique = overrideTechnique;
    }

    if (define.output !== 'screen') {
      this.isOutputScreen = false;
    }
  }

  private graph: RenderGraph;
  readonly define: PassDefine;
  public name: string;

  private overrideTechnique: Technique;

  private outputTarget: GLFramebuffer
  private isOutputScreen: boolean = true;

  private debuggingViewport: Vector4 = new Vector4();

  renderDebugResult(engine: ARTEngine) {
    if (!this.graph.debugViewer.shouldDrawPassDebug) {
      return;
    }
    engine.renderer.setRenderTargetScreen();
    this.graph.debugViewer.updatePassDebugViewport(this);
    engine.renderer.state.setViewport(
      this.debuggingViewport.x, this.debuggingViewport.y,
      this.debuggingViewport.z, this.debuggingViewport.w
    );
  }

  setOutPutTarget(textureNode: TextureNode) {
    this.outputTarget = textureNode.framebuffer;
  }

  execute(engine: ARTEngine, source: RenderSource) {

    // setup viewport and render target
    if (this.isOutputScreen) {
      if (this.graph.enableDebuggingView) {
        // when debug is true , we should use texture to render screen target pass
      } else {
        engine.renderer.setRenderTargetScreen();
        engine.renderer.state.setFullScreenViewPort();
      }
    } else {
      engine.renderer.setRenderTarget(this.outputTarget);
      engine.renderer.state.setViewport(0, 0, this.outputTarget.width, this.outputTarget.height);
    }
  


    if (this.overrideTechnique !== undefined) {
      engine.overrideTechnique = this.overrideTechnique;
    }

    engine.renderer.clear();

    engine.render(source);

    engine.overrideTechnique = null;


    if (this.graph.enableDebuggingView) {
      this.renderDebugResult(engine);
    }

  }
}