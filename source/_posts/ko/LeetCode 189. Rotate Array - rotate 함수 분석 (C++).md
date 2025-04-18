---
title: LeetCode 189. Rotate Array - rotate 함수 분석 (C++)
lang: ko
date: '2025-04-17T16:49:06.547Z'
excerpt: 배열을 In-place로 k만큼 밀어내는 rotate()함수에 대한 분석입니다.
categories: 
    - LeetCode
    - std container
tag:
    - c++
    - std container
    - Algorithm
---
# 요약
> 발단 : rotate()를 구현하는 문제를 풀어봄. 문제를 풀며 궁금했던 점들을 알아보았음.
> 1. 평범한 접근으로 rotate를 구현하면 **시간 O(n), 공간 O(n)** 으로 구현할 수 있음. 
> 2. O(n)의 공간 복잡도는 LeetCode 통계상 저조한 효율성을 갖고 있어 이를 In-place[^3] 방식으로 구현해야함.
> 3. 이미 `std::rotate()`가 In-place로 구현되어 있었고 내부 작동에 대해 분석해봄. (어떤 종류의 알고리듬을 사용하는지, 실제 구현이 어떻게 되어있는지)
# 개인적 배경 & 목적
C++을 손에 익힐 겸 매일 LeetCode 1문제 정도는 풀고 있습니다. LeetCode내 `인터뷰 상위 150문제`에서 자주 고르는데 오늘은 `Array/String` 주제에서 [Rotate Array](https://leetcode.com/problems/rotate-array/)가 끌려서 풀어봤습니다.

해당 문제에 대해 설명을 하자면
> `원본 배열 nums`와 `정수 k`가 주어질 때 nums 배열을 k번 `오른쪽 회전` 한 nums를 만들어라 

입니다. 이해를 돕기 위해 아래 시각화된 그림을 넣겠습니다.
![vector-rotation-svg.svg](/images/vector-rotation-svg.svg)문제 설명 예시 그림[^1]

> 우선 글은 제가 `문제를 어떻게 풀었는지` 보단 `어떤 효율적인 방법이 있는지`에 집중되어 있습니다.

어떤 의식의 흐름대로 진행되었는지 살펴봅시다.

# 스스로 생각한 과정들

## k의 값은 배열의 갯수내로 조정된다.  
k의 값의 범위는 $0 \leqq k \leqq 10^5$ 인데, nums 배열의 크기는 k보다 크거나 작을 수 있습니다. 

특정 상황에선  *n번 회전할 때 원래 상태로 돌아오는 상황*이 벌어집니다. 예를 들어 k가 10이고 배열의 갯수가 5이라면, 결과는 그대로 출력해야 하는 상황이라고 보시면 됩니다.

>고로 실질적인 회전 횟수를 구해줘야 하므로, `가상으로 n회전을 수행했다 치고 남은 나머지만큼 회전을 수행하도록 한다.`라는 아이디어가 필요합니다.

*추가로 n회전의 경우, 배열은 '그대로임'을 활용해 바로 반환합니다*
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
구현된 코드 1

## 문법 실수
k값 조정 이후 어떻게 회전을 시킬까를 고민해봤습니다. 
Python의 슬라이싱이 먼저 떠올라, 슬라이싱을 한 뒤 합치는 형식으로 진행해봤습니다.
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
해당 문법은 제대로 먹히지 않았고 `string과 같이 연산자 문법이 당연히 될 것`이라고 생각한 저의 실수였습니다.

## 구현 - 시간복잡도 O(n), 공간복잡도 O(n)
결국 특정 기능을 쓰지 않고 직접 구현했습니다.
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
하지만 메모리 측면에서 효율적이지 않은 솔루션이라고 결과가 나왔습니다.
![Pasted-image-20250417220236.png](/images/Pasted-image-20250417220236.png)LeetCode 분석 화면[^2]
# rotate 함수 - 공간복잡도 O(1)로 구현
## In-place 방식
이전 방식은 `temp`라는 복사된 배열을 통해 `nums`의 회전을 완성시킵니다. 문제는 원본 배열만큼의 공간이 필요해 공간 복잡도 O(n)이 나온다는 점입니다. 고로 해당 방식을 수정해 O(1)으로 작동하게끔 구현해야합니다.

> 일반적으로 공간복잡도 O(1)을 구현하기 위한 방식은 **In-place[^3]방식**이 있는 걸로 알고 있습니다.

이를 위해 Claude에게 질문한 결과. 이미 C++엔 In-place로 구현된 함수가 있고 그것은 `std::rotate()`함수라고 알려줬습니다.

## std::rotate() 실제 구현 부분
'그냥 함수 쓰면 되는구나' 보단 내부 동작이 어떻게 작동되는지 확인해 보고 싶었습니다.
그래서 [cppreference](https://en.cppreference.com/w/cpp/algorithm/rotate)[^4]를 찾아보고, local에 깔린 `std::rotate()`함수를 확인해본 결과 아래의 방식을 사용하는 것으로 확인했습니다. (Microsoft STL)
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

## std::rotate()의 핵심 분석
간략하게 코드를 설명하자면 **`반복자`에 따라 방법을 다르게 적용하는 것**입니다. 해당 내용은 [C++반복자](/ko/C++반복자)를 참고부탁드립니다.

> 크게 두가지 방법이며, 두 로직 모두 In-place 방식을 사용합니다.
> 1. 삼중 역전법
> 2. 순환 교체법

아래 그림을 통해 두 알고리듬의 작동 방식을 보여드리겠습니다.
![rotation-algorithms-fixed.svg](/images/rotation-algorithms-fixed.svg)삼중 역전법 & 순환 교체법 작동 방식 그림[^5]
 
 *코드로 다시 돌아가서 확인해봤습니다. 첫 If문이 가장 많이 쓰인다는 뉘앙스로 본다면  `삼중 역전법`을 자주 사용한다는 점을 확인할 수 있습니다.*

## 왜 삼중 역전법을 많이 쓰는가?
저도 단순히 해당 그림만 놓고 봤을 땐 `순환 교체법`이 `삼중 역전법`보다 빨라 보였습니다. 예시에서 순환 교체법의 경우는 swap을 7번을 수행하고 삼중 역전법은 3번의 뒤집기 과정에서 swap을 더 많이 수행한다고 보였습니다.

하지만 그렇지 않았고 관련 그림으로 설명하겠습니다.
![operation-comparison-with-inequality.svg](/images/operation-comparison-with-inequality.svg)각 알고리듬 연산 분석 그림[^6]

> 실질적으로 순환 교체법이 **재귀 함수 오버헤드 + 각종 검증 변수 & 비교 연산**이 더 필요해 연산이 더 많습니다.

# 마무리
간단히 사용하는 std함수들이 어떻게 구현되었는지 확인 해볼 수 있었음.
넋두리 : 알고리듬의 특성과 실질적 연산이 어떻게 작동되는지 확인해봐야. 효율적인 솔루션을 만들 수 있을 것 같음.

# 각주 
[^1]: 출처 : Claude 생성 SVG
[^2]: 출처 : LeetCode 캡처
[^3]: 개념 : 추가적인 메모리 할당이 없이 작업을 완성하는 것. 
[^4]: 출처 : https://en.cppreference.com/w/cpp/algorithm/rotate, Possible implementation 문단 - 순환 교체법 사용
[^5]: 출처 : 각주1 참고[^1]
[^6]: 출처 : 각주1 참고[^1]
