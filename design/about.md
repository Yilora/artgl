
# 关于ARTGL

自去年四月以来加入酷家乐实时图形渲染组以来，一直致力于图形渲染性能和方面做出提升。ARTGL原本作为我个人学习webgl渲染的side project，自去年下半年以来，逐渐成为代替公司项目进行快速迭代和探索的平台。今日，项目整体的设计已经初具雏形，在渲染引擎的整体设计方面也有了很多自己的想法。借此稍作整理。本文主要回答两个基本问题。


## ARTGL想要解决那些问题，主要着力的创新点在哪里？

最早我在我的个人网站的主页想做一个很简单的3d特效，使用threejs导致前端的js文件尺寸暴涨，而three内部据说由于大量使用 Object.defineproperties 等方法修改和扩展对象，导致无论对编译配置做出怎样的调整都无法实现tree shaking优化。而我也没有意愿寻找其他简单的webgl库。这反映一个问题是，three类型的webgl库，默认包含了过多我们根本不需要的东西，数学库可以全一点，这个没有问题，但那么多其他的Geometry， Material，Loader，等等我根本不需要，很多像动画/压缩纹理支持 等等，我都不需要，但是我却很难搞掉它们。

所以我希望一个好的webgl封装， 应该只提供最小最核心的实现，而那些各种各样的material ，light， geometry，应该能够非常方便的让用户自己扩展实现，或者引入独立的外部资源库，不会有多余的东西。我不希望我的项目里有一大堆的code是根本没有用的，虽然理论上我可以不care这些。

所以： **要充分隔离资源类型的支持和资源实现本身，一方面要做到用户能够清楚的方便的自己扩展和实现**， 另一方面，应当**仅提供最小化的核心实现， 并能够将资源的实现以最小粒度library化，** 说的简单一点就是，material ，light， geometry这种东西，也不说其他更高级的，应当做成独立的库，并且用户很容易扩展出自己的东西，不要一堆的都塞到我手里。

关于资源的library化，还很好做，主要的挑战在于：用户能够清楚的方便的自己扩展和实现。其实有人觉得这是引擎定位的考虑，比如three这个库，明显是给你用的，不是给你改的：当你的需求超出了他能支持的范围一点点，你就要开始看上万行源码，投身到webgl渲染的学习中来，然后fork改代码。根本不是说，我核心封装了这么几个概念，你应该如何自由的扩展和实现你自己的东西，然后在我的体系下完美运作。但如果真的能做到这样那岂不是更好，当然我不是说three做不到，而是做起来很难受。

另一方面，我想尝试的是诸多架构上的改进：  **目前市面上大多数的webgl封装， 都是webgl库，并不是框架。 使用库，我可以完成我的工作我的目的，但是这个世界上每一个人每一家企业，每一个项目，都有不同的需求。** 我不想听到说，诶babylon 更适合做游戏，xxx更适合做xxx等这种片面之词。当然，如果你不得不说要仅仅完成任务，那么大可不必如此追求。但我认为是时候要在架构上做出反思，打造出更好的东西出来。

关于framework， 一个是要**做好分层的设计，webgl渲染层，webgl数据层，渲染数据层， 场景数据层，渲染策略层，各个层面要做好充分的隔离**，甚至使得用户可以做到替换自定义实现，去除顶层抽象简化项目等目的。

为什么要自定义实现？ 举例说，场景数据层面，有的项目，场景树的设计完全是多余的，那么场景数据的组织是不是可以换成其他更简单的实现？ 或者另一个极端的例子，如果层与层之间的接口设计的很清楚，那么我理论上可以用canvas2d作为我的renderapi。

去除顶层抽象则是简化实现的考虑，举例说假设我只要用webgl做一个shader的特效，我甚至只要引入webgl渲染层一个层的实现，gl的数据就几个我自己处理，就非常的简洁轻量高效。或者我就是渲染一堆的东西，不想添加任何复杂的后处理，或者优化逻辑，那么渲染策略层就是可以不引入的部分。

关于framework， 另一个设计主要关于最顶层的渲染策略层。我们绝大多数看到的webgl库，都是把整个渲染流程，包括后处理的流程，全部用代码hardcode出来的，对外只暴露若干接口用以配置。这其实是极度缺乏设计和抽象的。正确的设计是**暴露一套描述渲染流程，优化策略的接口，使得用户可以使用这些轻松的构建自己的动态渲染管线** ，用户再以此封装出自己的配置项。或者说，用户可以使用此接口，设计出多种渲染管线，封装出多种viewer， 以支持不同场景的优化和使用需求。

关于这一点，是我非常兴奋的一处创新，在我公司项目的实践中，真的是深深感受到，渲染流程缺乏合理抽象的巨大缺陷。无论是代码质量，调试难度，创新原型，效果调优，通过合理的架构设计其实可以全方位的解决问题收益效率。而目前基于rendergraph的方案，已经经过TAA多pass的实践，取得了很好的成果。

总结下来，**ARTGL将提供 清晰的多层的webgl渲染基础设施，每一层都会针对具体的资源高度支持用户的定制和扩展，以最合理的方式，配合高度定制化的可扩展性，支持最广泛用户群体的不同应用场景。**

## milestone 和 release 计划？

受制于我的业余时间，和考虑到接口稳定性，我预计会在今年年底完成第一个稳定api的release版本，其中包含：基本webgl底层支持， art core中基本的资源抽象定义，场景树，rendergraph， 并基于此架构实现一个包含复杂后处理和复杂优化逻辑的viewer。由于使用了typescript 所以代码的重构和优化非常频繁和自信，api的接口变动非常频繁。至少目前是这样。希望自己不要弃坑。



