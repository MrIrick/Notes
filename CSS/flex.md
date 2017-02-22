总结一下容器的 `flex-wrap` 与子项的 `flex-shrink`、`flex-grow` 之间的关系。

- 当 `flex-wrap` 为 `wrap | wrap-reverse`，且子项宽度和不及父容器宽度时，`flex-grow` 会起作用，子项会根据 `flex-grow` 设定的值放大（为0的项不放大）
- 当 `flex-wrap` 为 `wrap | wrap-reverse`，且子项宽度和超过父容器宽度时，首先一定会换行，换行后，每一行的右端都可能会有剩余空间（最后一行包含的子项可能比前几行少，所以剩余空间可能会更大），这时 `flex-grow` 会起作用，若当前行所有子项的 `flex-grow` 都为0，则剩余空间保留，若当前行存在一个子项的 `flex-grow` 不为0，则剩余空间会被 `flex-grow` 不为0的子项占据；
- 当 `flex-wrap` 为 `nowrap`，且子项宽度和不及父容器宽度时，`flex-grow` 会起作用，子项会根据 `flex-grow` 设定的值放大（为0的项不放大）；
- 当 `flex-wrap` 为 `nowrap`，且子项宽度和超过父容器宽度时，`flex-shrink` 会起作用，子项会根据 `flex-shrink` 设定的值进行缩小（为0的项不缩小）。但这里有一个较为特殊情况，就是当这一行所有子项 `flex-shrink` 都为0时，也就是说所有的子项都不能缩小，就会出现讨厌的横向滚动条。


总结上面四点，可以看出不管在什么情况下，在同一时间，`flex-shrink` 和 `flex-grow` 只有一个能起作用，这其中的道理细想起来也很浅显：空间足够时，`flex-grow` 就有发挥的余地，而空间不足时，`flex-shrink` 就能起作用。当然，也就不难理解，`flex-wrap` 的值为 `wrap | wrap-reverse` 时 `flex-shrink`总也不起作用。既然可以换行，一般情况下空间就总是足够的，`flex-shrink` 当然不会起作用。