---
title: Leetcode 2145. Count the Hidden Sequences Solved - Prefix Sum Algorithm
lang: en
date: '2025-04-24T12:21:07.980Z'
excerpt: LeetCode problem solving course (Prefix Sum algorithm)
categories: 
    - LeetCode
    - C/C++
tag:
    - C/C++
    - Algorithm
mathjax: true
---
# overview
this article is an **incorrect answer note**.

here's a checklist of the process I went through.
___
- [x] Analyze the problem
- [x] Decomposition - Bottom-up of DP[^1]
- [x] 1st implementation $O(N*M^2)$
- [ ] Syntax - Member functions (methods) of vector class **underutilized**[^2]
- [ ] Streamlining of 1st implementation - finding a more suitable solution (cause: lack of algorithmic background)
___
> It always seems to me that **the hardest part of solving algorithmic problems** is **conjuring up the right algorithm for the problem (situation)**

there are two things that are lacking.
i've summarized the first in a footnote [^2], and this post will **focus on the second**.

so let's go through my solution.
# What I did
## Describe the problem
>  On the surface, the problem is
> 1. given an array differences
> 2. an array hidden with element values in the range **lower, upper** > 3
> 3. also an array hidden such that **differences\[i] = hidden\[i+1] - hidden\[i]**
> 4. print the number of possible hidden arrays.

![problem-visualization.svg](/images/problem-visualization.svg)
illustration of the problem[^3]

## My thoughts
i was not aware of the [Prefix Sum](/en/Prefix-Sum) algorithm when I solved the problem.

>So I missed the essence of the problem, which is "values are accumulated," and focused on "how do I get the combinations that make up the formula?
>
>In the end, I came up with nothing, and instead of thinking about efficiency, I adopted the **brute-force implementation and optimizing the implemented code**, which resulted in a bottom-up[^1] implementation to keep generating hidden\[i+1].

```cpp
class Solution {
public:
    int numberOfArrays(vector<int>& differences, int lower, int upper) {
    
        vector<vector<int>> arr;
        arr.resize(differences.size()+1);

       for(int val = lower; val <= upper; val++) {
            arr[0].push_back(val);
        }

        for(int i = 1;i<=differences.size();i++){
            for(auto val : arr[0]){
                for(auto prev : arr[i-1]){
                    if(val-prev == differences[i-1]){
                        arr[i].push_back(val);
                        break;
                    }
                }
            }
        }

        return arr[differences.size()].size();
    }
};
```

![dp-solution-visualization-1.svg](/images/dp-solution-visualization-1.svg)Illustration of that code[^3]
# # Correct answer process
## Failure
 that code had a time complexity of **$O(N*M^2)$, so not surprisingly, it timed out.

i couldn't come up with a solution, so I googled it, and the answer was to apply the [Prefix Sum](/en/Prefix-Sum) algorithm.

according to the answer, the key idea is
> differences\[i] = hidden\[i+1] - hidden\[i] > hidden\[i+1] = differences\[i] + hidden\[i], **that is, hidden\[i] = differences\[i-1] + hidden\[i-1]**.
> In my case, I was trying to find hidden\[i+1] that updates the differences array, and I missed the point that it's not about that, but about finding the value of hidden\[i] in the already determined differences array, **i.e., 'hidden[i] is determined by the previous value'**.

## Fixed
using these ideas, we eventually realize that **'once the initial hidden\[0] is determined, all of the hidden array is determined'**, and we can use this to work through the example
> differences = \[1, -3, 4], lower = 1, upper = 6 from
> **hidden\[0] = x** as an unknown, we have **hidden = \[x, x+1, x-2, x+4]**.
>
> Conditions
> 1. $lower \leqq x \leqq upper$
> 2. $lower \leqq x-2 (lowest value of cumulative sum)$, $x+4 (highest value of cumulative sum) \leqq upper$
>
> two conditions to find the range of x.
 

if we implemented this in code, we would use
```cpp
class Solution {
public:
    int numberOfArrays(vector<int>& differences, int lower, int upper) {
        
        // prefix를 0으로 하는 이유는 수식의 x-prefix(최소 or 최대)값인 prefix를 그대로 구할 수 있게됨. 그것을 활용해 x의 범위를 구할 수 있음.
        long long prefix = 0;
        int max_val = -100001;
        int min_val = 100001;
        
        for(int val : differences){
            prefix += val;
            if(min_val > prefix) min_val = prefix;
            if(max_val < prefix) max_val = prefix;
        }

        // 두가지 조건에 맞는 값을 정하는 부분, 작은 값중 가장 큰 값을 고름, 큰 값중 가장 작은 값을 고름
        long long low = max((long long)lower, (long long)lower - min_val);
        long long high = min((long long)upper, (long long)upper - max_val);
		
		if(low > high) return 0;
		
        return high - low +1;
    }
};
```

i was confused as to **why you're comparing lower, to lower-min_val**. as I wrote in the code, I was looking at (x-prefix) itself as a (min or max) value, which didn't make sense to me, as I didn't realize that if prefix goes to zero, you get the full relative prefix value.

\*If we want the initial value to be some other value ex) 1000, then we need to do the expression `(long long)lower, (long long)lower - min_val`, which is `(long long)lower, (long long)lower - (min_val - 초기값)`.

# Footnotes
[^1]: bottom-up approach: solving the problem from the smallest part Example.) an implementation of the Fibonacci sequence as a loop [Top-Down & Bottom-Up Approach (Top-Down & Bottom-Up)](/en/Top-Down-&-Bottom-Up-Approach-(Top-Down-&-Bottom-Up)) see article
[^2]: [reserve() vs resize() in vector primitives (C++)](/en/reserve-vs-resize-in-vector-class-c) see article
[^3]: Source: Claude-generated SVG, Claude-generated SVG, not well placed due to lack of performance.
