---
title: Analyze the Rotate Function (C++) - Leetcode 189. Rotate Array
lang: en
date: '2025-04-17T16:49:06.547Z'
excerpt : A breakdown of the rotate() function, which pushes an array in-place by k.
categories: 
    - C/C++
    - LeetCode
tag:
    - C/C++
    - std container
    - Algorithm
mathjax: true
---
# Summary
> Rationale: Solved a problem implementing rotate(). while solving the problem, I realized that.
> 1. The usual approach to implementing rotate is **O(n) in time, O(n) in space**.
> 2. O(n) space complexity is not efficient according to LeetCode statistics, so we need to implement it in-place[^3].
> 3. `std::rotate()` was already implemented in-place and analyzed its inner workings. (What kind of algorithms are used, what is the actual implementation)
# Personal Background & Purpose
I am solving about 1 LeetCode problem every day to learn C++. I often choose from `인터뷰 상위 150문제` in LeetCode, but today I was attracted to [Rotate Array](https://leetcode.com/problems/rotate-array/) in the topic `Array/String` and solved it.

to explain the issue
> Given `원본 배열 nums` and `정수 k`, create a nums array with nums `오른쪽 회전` k times

to help you understand, here's a visualization to illustrate.
![vector-rotation-svg.svg](/images/vector-rotation-svg.svg)Example illustration of the problem[^1]

> First of all, the post is focused on `어떤 효율적인 방법이 있는지` rather than my `문제를 어떻게 풀었는지`.

let's take a look at what the stream of consciousness looked like.

# I thought to myself

## The value of k is adjusted to be within the number in the array.  
the range of values of k is $0 \leqq k \leqq 10^5$, but the size of the nums array can be larger or smaller than k.

in certain situations, it will return to its original state after *n rotations*. for example, if k is 10 and the number in the array is 5, this is a situation where you want to print the result as it is.

>We need to get a realistic number of rotations, hence the idea of `가상으로 n회전을 수행했다 치고 남은 나머지만큼 회전을 수행하도록 한다.`.

*additionally, for n rotations, the array will return directly using 'as is'* *
```cpp
class Solution {
public:
    void rotate(vector<int>& nums, int k) {
        int n = nums.size();
        k = k % n;
        if(k==0) return;

    }
};
```
implemented code 1

## Grammar mistake
after adjusting the k-value, I thought about how to rotate it.
Slicing in Python came to mind first, so I tried slicing and then merging.
``` cpp
class Solution { 
public: 
	void rotate(vector<int>& nums, int k) {
		int n = nums.size();
        k = k % n;
        
		return slice(nums.end()-cnt, nums.end()) + slice(nums.begin(), nums.end()-cnt-1);
	} 
};
```
that syntax didn't work and it was a mistake on my part to think it was `string과 같이 연산자 문법이 당연히 될 것`.

## Implementation - O(n) temporal complexity, O(n) spatial complexity
i ended up not using the specific function and implemented it myself.
``` cpp
class Solution {
public:
    void rotate(vector<int>& nums, int k) {
        int n = nums.size();
        k = k % n; 
        if (k == 0) return; 
        
        vector<int> temp = nums;
        
        for (int i = 0; i < k; i++) nums[i] = temp[n - k + i];
        for (int i = 0; i < n - k; i++) nums[k + i] = temp[i];
    }
};
```
however, it turned out to be an inefficient solution in terms of memory.
![Pasted-image-20250417220236.png](/images/Pasted-image-20250417220236.png)LeetCode analysis screen[^2]
# rotate function - implemented with O(1) space complexity
## In-place method
the previous method completes the rotation of `nums` with a copied array called `temp`. the problem is that it takes as much space as the original array, resulting in a space complexity of O(n). we need to modify the method so that it works in O(1).

> > In general, I know there is an **in-place[^3] method** for implementing a space complexity of O(1).

to this end, I asked Claude. he told me that there is already an in-place implementation in C++ and it is the function `std::rotate()`.

## std::rotate() actual implementation part
rather than "just write a function", I wanted to see how the internal behavior works.
so I looked up [cppreference](https://en.cppreference.com/w/cpp/algorithm/rotate)[^4], checked the localized `std::rotate()` function, and found that it uses the following: (Microsoft STL)
```cpp
_EXPORT_STD template <class _FwdIt>
_CONSTEXPR20 _FwdIt rotate(_FwdIt _First, _FwdIt _Mid, _FwdIt _Last) {
    // exchange the ranges [_First, _Mid) and [_Mid, _Last)
    // that is, rotates [_First, _Last) left by distance(_First, _Mid) positions
    // returns the iterator pointing at *_First's new home

    _Adl_verify_range(_First, _Mid);
    _Adl_verify_range(_Mid, _Last);
    auto _UFirst      = _Get_unwrapped(_First);
    auto _UMid        = _Get_unwrapped(_Mid);
    const auto _ULast = _Get_unwrapped(_Last);

    if (_UFirst == _UMid) {
        return _Last;
    }
  
    if (_UMid == _ULast) {
        return _First;
    }
    // 1. 삼중 역전법 - 임의 접근 반복자
    if constexpr (_Is_cpp17_random_iter_v<_FwdIt>) {
        _STD reverse(_UFirst, _UMid);
        _STD reverse(_UMid, _ULast);
        _STD reverse(_UFirst, _ULast);
        _Seek_wrapped(_First, _UFirst + (_ULast - _UMid));
    } 
    // 2. 삼중 역전법(위에서 변형됨) - 양방향 반복자
    else if constexpr (_Is_cpp17_bidi_iter_v<_FwdIt>) {
        _STD reverse(_UFirst, _UMid);
        _STD reverse(_UMid, _ULast);
        auto _Tmp = _Reverse_until_sentinel_unchecked(_UFirst, _UMid, _ULast);
        _STD reverse(_Tmp.first, _Tmp.second);
        _Seek_wrapped(_First, _UMid != _Tmp.first ? _Tmp.first : _Tmp.second);
    }
    // 3. 순환 교체법
    else {
        auto _UNext = _UMid;
        do { // rotate the first cycle
            swap(*_UFirst, *_UNext); // intentional ADL
            ++_UFirst;
            ++_UNext;
            if (_UFirst == _UMid) {
                _UMid = _UNext;
            }
        } while (_UNext != _ULast);
        _Seek_wrapped(_First, _UFirst);
        while (_UMid != _ULast) { // rotate subsequent cycles
            _UNext = _UMid;
            do {
                swap(*_UFirst, *_UNext); // intentional ADL
                ++_UFirst;
                ++_UNext;
                if (_UFirst == _UMid) {
                    _UMid = _UNext;
                }
            } while (_UNext != _ULast);
        }
    }

    return _First;
}
```

## Breaking down the core of std::rotate()
in a nutshell, the code is simply applying the method differently according to **`반복자`. please refer to [C++ Iterators](/en/C++-Iterators) for more details.

> > There are two main methods, both logic uses the in-place method.
> 1. triple inversion
> 2. cyclic replacement

the figure below shows how both algorithms work.
![rotation-algorithms-fixed.svg](/images/rotation-algorithms-fixed.svg)Illustration of how triple inversion & cyclic replacement work[^5]
 
 *going back to the code, we can see that `삼중 역전법` is used most often, based on the nuance that the first If statement is the most common.*

## Why do we use triple inversion so much?
to me, `순환 교체법` looks faster than `삼중 역전법` simply by looking at the figure. In the example, the cyclic replacement method performs 7 swaps and the triple inversion method performs more swaps in the course of 3 flips.

however, this was not the case, and I'll explain with a related figure.
![operation-comparison-with-inequality.svg](/images/operation-comparison-with-inequality.svg)Illustration of the breakdown of each algorithm's operation[^6]

> In effect, the cyclic swap method has more operations because it requires **recursive function overhead + various validation variables & comparison operations**.

# Conclusion
we were able to see how simple std functions are implemented.
i need to check the nature of the algorithm and how the actual operations work. I think I can create an efficient solution.

# Footnotes
[^1]: Source: SVG created by Claude
[^2]: Source: LeetCode capture
[^3]: concept : completing a task without additional memory allocation.
[^4]: Source: https://en.cppreference.com/w/cpp/algorithm/rotate, Possible implementation paragraph - using recursive replacement
[^5]: Source: see footnote 1[^1]
[^6]: Source: see footnote 1[^1]
