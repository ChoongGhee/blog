# 개요
이 글은 **오답 노트**입니다.

제가 거쳐온 과정을 체크리스트로 표현해보면 아래와 같습니다.
___
- [x] 문제 분석
- [x] 분해 - DP의 Bottom-up[^1]
- [x] 1차 구현 $O(N*M^2)$
- [ ] 문법 - vector 클래스의 멤버 함수(methods) **활용 능력 부족**[^2]
- [ ] 1차의 효율화 - 더 적합한 솔루션 찾기 (원인 : 알고리듬 배경 지식 부족)
___
> **항상 문제(상황)** 에 대해 적절한 **알고리듬을 엮는, 즉 연상 하는 것**이 알고리듬 문제 풀이에서 *가장 어려운 것 같습니다.*

부족한 부분이 두 가지가 있습니다. 
첫째는 각주[^2]에 정리해놓았으니 참고바라며, 이번 글은 **두 번째 부분에 대해 집중적으로 설명**하겠습니다.

이제 제 풀이를 짚어가며 진행해보겠습니다.
# 직접 수행한 과정
## 문제 설명
> 표면적으로 문제를 설명하면 
> 1. 배열 differences가 주어질 때 
> 2. **lower, upper 범위의 요소 값을 가지는** 배열 hidden
> 3. 또한 **differences\[i] = hidden\[i+1] - hidden\[i]를 성립**하는 배열 hidden
> 4. 가능한 hidden 배열의 갯수을 출력해라.

![[problem-visualization.svg]]
문제 설명 그림[^3]

## 저의 생각
저는 문제를 풀 당시 [[누적합 Prefix Sum]]알고리듬을 몰랐습니다. 

>그래서 **핵심 수식의 본질인 '값이 누적되어 진행한다'를 놓쳤**고, **'해당 수식을 이루는 조합들을 어떻게 구해야 하는가?'에 집중**했습니다. 
>
>결국 아무 생각이 안떠올라, 효율성을 따지는 것보다 **가장 brute하게 구현하고 구현된 코드를 최적화 하는 방식을 채택**했습니다. 그 결과 Bottom-Up[^1]방식을 통해 hidden\[i+1]을 계속 생성하도록 구현했습니다.

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

![[dp-solution-visualization 1.svg]]해당 코드 설명 그림[^3]
# 정답 과정
## 실패 
 해당 코드는 **$O(N*M^2)$의 시간복잡도**를 갖고 있었으므로, 당연히 시간 초과가 발생했습니다.

결국 해답이 떠오르질 않아 검색해보았고, [[누적합 Prefix Sum]]알고리듬을 적용하라는 것이였습니다.

해답에 따르면, 핵심 아이디어는
>  differences\[i] = hidden\[i+1] - hidden\[i] > hidden\[i+1] = differences\[i] + hidden\[i], **즉 hidden\[i] = differences\[i-1] + hidden\[i-1]** 을 알아내는 것이었습니다. 
>  제 경우에는 differ 배열을 갱신하는 hidden\[i+1]을 찾고자 했는데, 그 관점이 아니라 이미 정해진 differ 배열에서 hidden\[i]의 값을 찾는, 즉 **'이전의 값에 의해 hidden[i]가 결정된다'** 라는 것을 놓쳤습니다. 

## 해결
이러한 아이디어를 활용하면 결국 **'초기 hidden\[0]이 결정되면 모든 hidden 배열이 결정된다는 점'** 을 알 수 있고 이를 활용해 예시를 통해 전개하면
> differences = \[1, -3, 4], lower = 1, upper = 6 에서
> **hidden\[0] = x**를 미지수로 두고 hidden 배열을 만들면, **hidden = \[x, x+1, x-2, x+4]** 입니다.
> 
> 조건
> 1. $lower \leqq x \leqq upper$
> 2.  $lower \leqq x-2(누적합의 최솟값)$,     $x+4(누적합의 최댓값) \leqq upper$
>
> 두 가지 조건을 통해 x의 범위를 구함.
 

이를 코드로 구현하면
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

저는 **'왜 low값에 lower, 와 lower-min_val을 비교'** 하는지 헤맸습니다. 코드에 적어놓았듯이 (x-prefix) 자체를 (최소 or 최대)값으로 바라보아 납득을 못한 것이였는데, 이를 prefix가 0이되면 온전한 상대적인 prefix값을 알 수 있는 점을 몰랐습니다. 

\*만약 초기값을 다른 값 ex) 1000으로 한다면 `long long)lower, (long long)lower - min_val`해당 식을 `long long)lower, (long long)lower - (min_val - 초기값)`를 해줘야합니다.

# 각주
[^1]: 상향식 접근 : 문제를 해결할때 가장 작은 부분부터 해결하는 형태 예시) 피보나치 수열을 반복문으로 구현한 것[[하향식 접근 & 상향식 접근 (Top-Down & Bottom-Up)]] 글 참조
[^2]: [[vector 자료형의 reserve() vs resize() (C++)]] 글 참조
[^3]: 출처 : Claude 생성 SVG, Claude 생성 성능이 부족해, 제대로된 배치가 되지 않았습니다.