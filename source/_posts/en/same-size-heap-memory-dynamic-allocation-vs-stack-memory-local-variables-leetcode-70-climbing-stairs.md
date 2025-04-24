---
title: >-
  Same Size Heap Memory (Dynamic Allocation) Vs Stack Memory (Local Variables) -
  Leetcode 70. Climbing Stairs
lang: en
date: '2025-04-18T15:57:06.164Z'
excerpt: When creating arrays, compare actual memory usage between dynamic allocation using HEAP memory and lazy variables using STACK memory
categories: 
    - C/C++
    - LeetCode
tag:
    - C/C++
mathjax: true
---
# summarize

> LeetCode memory analysis shows that dynamic allocation uses more memory than local variables.
> > Conclusion: Dynamic allocation is **using an allocator to help manage memory**. many factors increase the memory footprint, including *1. overhead for managing the furnace, 2. padding for alignment, 3. fragmentation caused, etc.

# Background
the [Dynamic Programming](/en/Dynamic-Programming) problem [Climbing Sairs](https://leetcode.com/problems/climbing-stairs/), I generated `캐시 변수` via `동적할당` as shown below.

```cpp
class Solution {
    public:
        int climbStairs(int n) {

            if(n == 1) return 1;

            int* dp = new int[2];
            dp[0] = 1;
            dp[1] = 1;

            for(char i =2; i <= n; i++){
                int temp = dp[0] + dp[1];
                dp[0] = dp[1];
                dp[1] = temp;
            }

            return dp[1];
        }
    };
```

what I'm seeing now makes me wonder: `왜 굳이 동적할당을 했는가?`. perhaps I didn't think carefully and immediately thought of the dynamic assignment as `변수를 선언해야하겠구나`.

as usual, if I'm not close to 100% in time and space analysis, I'm curious. So I asked Claude how to do it more efficiently and came up with the code below, which allocates to a local variable, i.e. stack memory.
```cpp
class Solution {
    public:
        int climbStairs(int n) {

            if(n == 1) return 1;
            int prev = 1;
            int curr = 1;

            for(int i = 2; i <= n; i++) {
                int temp = prev + curr;
                prev = curr;
                curr = temp;
            }

            return curr;
        }
    };
```

# Why do local variables use less memory?
> As the subtitle suggests, I was wondering why local variables stored in stack memory use less memory. for two reasons.
>
> 1. I'm not sure, but local variables don't do something called freeing memory (at least not in code)
> > 2. I made the mistake of not freeing them, but in the case of dynamic allocation, freeing them would use less memory than prev and curr.

when I asked him about this, he said that my approach was correct, but that I was missing something. here's a condensed version of the explanation.
![memory-comparison.svg](/images/memory-comparison.svg)Illustration comparing each approach[^1]

# Conclusion
> Conclusion: as I said in the summary, **I overlooked the memory required for dynamic allocation
-  Reminded that writing external functions in C/C++ takes extra memory.

# Footnotes
[^1]: Source: SVG created by Claude
