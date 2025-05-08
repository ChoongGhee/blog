# 개요
해당 LeetCode문제([LeetCode_2145](https://leetcode.com/problems/count-the-hidden-sequences/))에서 주어진 `differences`배열의 사이즈에 맞는 1차원 vector 배열(가칭 arr)을 생성하고자 했습니다.[^1]
## 발단
vector arr은 **주어진`differences`의 길이로 정해지기 때문에 예상된 메모리 공간을 먼저 선언하는 작업을 했습니다, 즉, `reserve()` 멤버 함수를 사용**해 메모리 공간을 확보하고자 했습니다.

그러나 LeetCode 실행결과 오류가 생겼습니다.
#  reserve() vs resize()의 차이
> 제가 간과한 점은 **"vector의 capacity와 size의 차이가 있다"** 이었습니다. 
> 
> 하나씩 풀어보면,  capacity는 *해당 자료구조가 감당할 수 있는 최대 크기*이고
> size는 해당 *자료구조의 현재 원소의 갯수* 입니다.
 
 글보단 아래 그림으로 해당 두 개념을 설명해보겠습니다. 
## vector의 배열 관리 구조 요약
vector는 내부 배열 관리 핵심은 **세가지 포인터의 상호작용**으로 이루어져 있습니다.

> 배열의 기준 : first
> 현재 할당된 원소의 마지막 : last
> 자료구조 메모리의 마지막 : end

![[vector-memory-svg-reorganized.svg]]std::vector내부 배열 관리 구조[^2]


> 요약하면, resize()는 **\_Mylast 포인터**를 증가하도록 하는 함수이며, reserve()는 **\_Myend 포인터**를 증가하도록 하는 함수입니다.
>
> 이때*last는 end보다 작은 주소를 갖도록 해야되며, 다른 상황이 생기면 조정합니다*
## 실제로 그러한가?
> 이 부분은 추상화된 위 요약이 구현됐는지 확인하기 위한 과정입니다. (근거를 찾는 과정)
> 
> 아래는 Microsoft Visual C++(MSVC) 컴파일러의 C++17/C++20 표준 라이브러리 구현에서 발췌한 코드이며, 이 코드는 Visual Studio 2019 이상 버전에서 사용되는 STL(Standard Template Library)의 vector 구현을 보여줍니다.
>
> 또한 현재 저의 수준으론 C++의 '템플릿 메타 프로그래밍'을 이해하기 어려워, 관련 타입 변수들의 연결에 설명이 부족합니다. 추후에 '템플릿 메타 프로그래밍'에 대해 논하면 좋을 것 같습니다.

### 1. vector class 기본 선언
먼저 `std::vector` 클래스의 기본 선언부입니다:
``` c++
_EXPORT_STD template <class _Ty, class _Alloc = allocator<_Ty>>
class vector { // varying size array of values
private:
    template <class>
    friend class _Vb_val;
    friend _Tidy_guard<vector>;

    using _Alty        = _Rebind_alloc_t<_Alloc, _Ty>;
    using _Alty_traits = allocator_traits<_Alty>;

public:
    static_assert(!_ENFORCE_MATCHING_ALLOCATORS || is_same_v<_Ty, typename _Alloc::value_type>,
        _MISMATCHED_ALLOCATOR_MESSAGE("vector<T, Allocator>", "T"));
    static_assert(is_object_v<_Ty>, "The C++ Standard forbids containers of non-object types "
                                    "because of [container.requirements].");

    using value_type      = _Ty;
    using allocator_type  = _Alloc;
    using pointer         = typename _Alty_traits::pointer;
    using const_pointer   = typename _Alty_traits::const_pointer;
    using reference       = _Ty&;
    using const_reference = const _Ty&;
    using size_type       = typename _Alty_traits::size_type;
    using difference_type = typename _Alty_traits::difference_type;
    
    // ... (이하 생략)
    
    private:
    // 관련된 변수인 _Scary_val
    using _Scary_val = _Vector_val<conditional_t<_Is_simple_alloc_v<_Alty>, _Simple_types<_Ty>,
        _Vec_iter_types<_Ty, size_type, difference_type, pointer, const_pointer>>>;
    // ...
    _Compressed_pair<_Alty, _Scary_val> _Mypair;
};
```
여기서  **\_Scary_val**에  집중해주시면 되겠습니다.

### 2. \_Vector_val 구조(\_Scary_val의 변수 타입)
**\_Scary_val**은 결국 이런 저런 과정[^2]을 거쳐 **\_Vector_val**타입을 갖게됩니다. 아래는 **\_Vector_val**의 선언부입니다:
``` C++
template <class _Val_types>
class _Vector_val : public _Container_base {
public:
    using value_type      = typename _Val_types::value_type;
    using size_type       = typename _Val_types::size_type;
    using difference_type = typename _Val_types::difference_type;
    using pointer         = typename _Val_types::pointer;
    using const_pointer   = typename _Val_types::const_pointer;
    using reference       = value_type&;
    using const_reference = const value_type&;

    _CONSTEXPR20 _Vector_val() noexcept : _Myfirst(), _Mylast(), _Myend() {}

    _CONSTEXPR20 _Vector_val(pointer _First, pointer _Last, pointer _End) noexcept
        : _Myfirst(_First), _Mylast(_Last), _Myend(_End) {}

    // ... (기타 멤버 함수들)

    pointer _Myfirst; // pointer to beginning of array
    pointer _Mylast;  // pointer to current end of sequence
    pointer _Myend;   // pointer to end of array
};
```
> 여기서 중요한건 **\_Myfirst, \_Mylast, \_Myend 포인터가 존재한다는 점**입니다.

### 3. 주요 함수 구현
실제로 3포인터를 사용함을 알았으니, 실제로 함수들이 이것들을 통해 작동하는지 확인해보겠습니다.

- size()함수
``` c++
_NODISCARD _CONSTEXPR20 size_type size() const noexcept {
    auto& _My_data = _Mypair._Myval2;
    return static_cast<size_type>(_My_data._Mylast - _My_data._Myfirst);
}
```

- capacity()함수
``` c++
 _NODISCARD _CONSTEXPR20 size_type capacity() const noexcept {
    auto& _My_data = _Mypair._Myval2;
    return static_cast<size_type>(_My_data._Myend - _My_data._Myfirst);
}
```

- empty()함수
``` c++
_NODISCARD_EMPTY_MEMBER _CONSTEXPR20 bool empty() const noexcept {
    auto& _My_data = _Mypair._Myval2;
    return _My_data._Myfirst == _My_data._Mylast;
}
```

- reserve()함수
``` C++
_CONSTEXPR20 void reserve(_CRT_GUARDOVERFLOW size_type _Newcapacity) {
    // increase capacity to _Newcapacity (without geometric growth), provide strong guarantee
    if (_Newcapacity > capacity()) { // something to do (reserve() never shrinks)
        if (_Newcapacity > max_size()) {
            _Xlength();
        }

        _Reallocate<_Reallocation_policy::_At_least>(_Newcapacity);
    }
}
```

- resise()함수
``` C++
_CONSTEXPR20 void resize(_CRT_GUARDOVERFLOW const size_type _Newsize) {
    // trim or append value-initialized elements, provide strong guarantee
    _Resize(_Newsize, _Value_init_tag{});
}

_CONSTEXPR20 void resize(_CRT_GUARDOVERFLOW const size_type _Newsize, const _Ty& _Val) {
    // trim or append copies of _Val, provide strong guarantee
    _Resize(_Newsize, _Val);
}

template <class _Ty2>
_CONSTEXPR20 void _Resize(const size_type _Newsize, const _Ty2& _Val) {
    // trim or append elements, provide strong guarantee
    auto& _Al           = _Getal();
    auto& _My_data      = _Mypair._Myval2;
    pointer& _Myfirst   = _My_data._Myfirst;
    pointer& _Mylast    = _My_data._Mylast;
    const auto _Oldsize = static_cast<size_type>(_Mylast - _Myfirst);
    if (_Newsize < _Oldsize) { // trim
        const pointer _Newlast = _Myfirst + _Newsize;
        _Orphan_range(_Newlast, _Mylast);
        _Destroy_range(_Newlast, _Mylast, _Al);
        _ASAN_VECTOR_MODIFY(static_cast<difference_type>(_Newsize - _Oldsize));
        _Mylast = _Newlast;
        return;
    }

    if (_Newsize > _Oldsize) { // append
        const auto _Oldcapacity = static_cast<size_type>(_My_data._Myend - _Myfirst);
        if (_Newsize > _Oldcapacity) { // reallocate
            _Resize_reallocate(_Newsize, _Val);
            return;
        }

        _ASAN_VECTOR_EXTEND_GUARD(_Newsize);
        const pointer _Oldlast = _Mylast;
        if constexpr (is_same_v<_Ty2, _Ty>) {
            _Mylast = _Uninitialized_fill_n(_Oldlast, _Newsize - _Oldsize, _Val, _Al);
        } else {
            _STL_INTERNAL_STATIC_ASSERT(is_same_v<_Ty2, _Value_init_tag>);
            _Mylast = _Uninitialized_value_construct_n(_Oldlast, _Newsize - _Oldsize, _Al);
        }
        _ASAN_VECTOR_RELEASE_GUARD;
        _Orphan_range(_Oldlast, _Oldlast);
    }

    // if _Newsize == _Oldsize, do nothing; avoid invalidating iterators
}
```

> size(), capacity()의 경우 first를 기준으로 last, end를 통해 계산을 하는 모습을 볼 수 있습니다.
> empty()는 last와 first를 통해 확인을 하고
> 특히 **reserve()는 재할당만 수행한다는 점**
> 그리고 **resize()는 원소의 크기에 따라 용량까지 작업하는 점을 확인** 할 수 있습니다.
# 각주
[^1]: [[동적 프로그래밍 Dynamic Programming]] 접근법
[^2]: 출처 : Claude 생성 SVG
[^3]: 템플릿 메타 프로그래밍