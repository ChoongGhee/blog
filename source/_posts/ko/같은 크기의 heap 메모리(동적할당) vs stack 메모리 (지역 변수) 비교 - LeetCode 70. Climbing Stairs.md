---
title: 같은 크기의 heap 메모리(동적할당) vs stack 메모리 (지역 변수) 비교 - LeetCode 70. Climbing Stairs
lang: ko
date: '2025-04-18T15:57:06.164Z'
excerpt: 배열을 생성할 때, heap 메모리를 사용하는 동적할당과 stack 메모리를 사용하는 지연 변수 간 실질적 메모리 이용량 비교
categories: 
    - C/C++
    - LeetCode
tag:
    - C/C++
mathjax: true
---
# 요약

> LeetCode 메모리 분석 결과, 동적할당이 지역 변수보다 메모리를 더 쓴다는 점을 알게 됨.
> 결론 : 동적할당은 **메모리 관리를 도와주는 할당기를 사용하는 것**임. 고로 관리를 위한 *1. 오버헤드, 2. 정렬을 위한 패딩, 3. 발생된 단편화*등등 많은 요인들이 메모리 용량을 늘리는 것임.

# 배경
4월 10일 경 풀었던 [동적 프로그래밍 Dynamic Programming](/ko/동적-프로그래밍-Dynamic-Programming)문제 [Climbing Sairs](https://leetcode.com/problems/climbing-stairs/)에서 저는 아래와 같이 `동적할당`을 통해 `캐시 변수`를 생성했습니다.

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

지금 보면서 느끼는 것은 `왜 굳이 동적할당을 했는가?`라는 의문이 듭니다. 아마도 대충 `변수를 선언해야하겠구나`라고 동적할당을 떠올렸나봅니다.

각설하고 여느때 처럼 시간, 공간 분석에서 100%에 가깝지 않아 호기심이 생겼습니다. 그래서 더 효율적인 방안을 Claude에게 질문했고 아래처럼 지역 변수, 즉 스택 메모리에 할당하여 사용하는 코드가 나왔습니다.
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

# 왜 지역 변수가 더 적은 메모리를 쓰는가?
> 저는 소제목처럼, 스택 메모리에 저장되는 지역 변수가 왜 더 적게 쓰는지 의문이였습니다. 아래 두가지 이유로 말이죠.
> 
> 1. 확실친 않지만 **지역 변수는 메모리 해제라는 것을 하지 않는다.** (코드 상으로 봐도)
> 2. 코드는 해제하지 않은 실수를 했지만 동적할당의 경우 해제를 할 경우 prev, curr 만큼의 메모리가 더 적게 쓰일 것이다.

이에 대해 질문을 하니 제 접근은 맞지만 제가 놓친게 있다고 했습니다. 아래의 설명이 압축된 그림으로 설명하겠습니다.
![memory-comparison.svg](/images/memory-comparison.svg)각 방식 비교 그림[^1]

# 마무리
> 결론 : 요약에 말했다 싶이, **동적할당기에 필요로되는 메모리를 간과함.**
-  C/C++의 외부 함수를 쓸 때 메모리가 추가로 들어간다는 점을 다시금 상기함.

# 각주
[^1]: 출처 : Claude 생성 SVG
