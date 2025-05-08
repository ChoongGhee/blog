---
title: Reserve() Vs Resize() in Vector Class (C++)
lang: en
date: '2025-05-08T12:51:30.139Z'
excerpt: About the internal member functions reserve and resize of the vector class in the std container.
categories: 
    - C/C++
    - LeetCode
tag:
    - C/C++
    - std
    - vector
mathjax: true
---
# Overview
in this LeetCode problem ([LeetCode_2145](https://leetcode.com/problems/count-the-hidden-sequences/)), we wanted to create a one-dimensional vector array (called arr) that fits the size of the given array `differences`.[^1]
## Oops
since the length of the vector arr is **given`differences`, we wanted to declare the expected memory space first, i.e., use the `reserve()` member function to free up memory space.

however, when I ran LeetCode, I got the following error.
# reserve() vs resize()
> What I overlooked was that "there is a difference between capacity and size of a vector".
>
> > To break it down, capacity is the *maximum* size that the data structure can hold
> > size is the current number of elements in that *structure*.
 
 rather than writing, I'll illustrate these two concepts with the figure below.
## Summary of VECTOR's array management structure
at its core, VECTOR's internal array management consists of the interaction of three pointers.

> the base of the array: first
> the last of the currently allocated elements: last
> the end of the data structure memory : end

![vector-memory-svg-reorganized.svg](/images/vector-memory-svg-reorganized.svg)std::vectorInternal Array Management Structure[^2]


> To summarize, resize() is a function that causes the **\_Mylast pointer** to be incremented, and reserve() is a function that causes the **\_Myend pointer** to be incremented.
>
> *last should have an address less than end, and we'll adjust if other circumstances arise*
## Is this actually the case?
> > This part is to verify that the above abstracted summary is implemented (the process of finding the proof)
>
> > Below is an excerpt of code from the Microsoft Visual C++ (MSVC) compiler's implementation of the C++17/C++20 standard library, which demonstrates the vector implementation of the Standard Template Library (STL) used in Visual Studio 2019 and later versions.
>
> Also, at my current level of understanding of C++'s "template metaprogramming", the linking of related type variables is not well explained. it would be good to discuss 'template metaprogramming' in the future.

### 1. Basic declaration of vector class
first, here is the basic declaration of the `std::vector` class:
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
we can focus on the **\_Scary_val** here.

### 2. \_Vector_val structure (variable type of \_Scary_val)
*eventually, **\_Scary_val** will end up having a type of **\_Vector_val** after some blah, blah, blah [^2]. below is the declaration of **\_Vector_val**:
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
> > The important thing here is that the pointers **\_Myfirst, \_Mylast, \_Myend** exist.

### 3. Implementing the main functions
now that we know we're actually using 3 pointers, let's make sure our functions actually work through them.

- size() function
``` c++
_NODISCARD _CONSTEXPR20 size_type size() const noexcept {
    auto& _My_data = _Mypair._Myval2;
    return static_cast<size_type>(_My_data._Mylast - _My_data._Myfirst);
}
```

- capacity() function
``` c++
 _NODISCARD _CONSTEXPR20 size_type capacity() const noexcept {
    auto& _My_data = _Mypair._Myval2;
    return static_cast<size_type>(_My_data._Myend - _My_data._Myfirst);
}
```

- empty() function
``` c++
_NODISCARD_EMPTY_MEMBER _CONSTEXPR20 bool empty() const noexcept {
    auto& _My_data = _Mypair._Myval2;
    return _My_data._Myfirst == _My_data._Mylast;
}
```

- reserve() function
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

- resise() function
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

> For size() and capacity(), you can see that we are calculating through last and end based on first.
> empty() checks through last and first
> > In particular, **reserve() only does a reallocation**
> and **resize() works up to capacity based on the size of the element**.
# Footnotes
[^1]: [Dynamic Programming Dynamic Programming](/en/Dynamic-Programming-Dynamic-Programming) approach]]
[^2]: Source: SVG created by Claude
[^3]: template metaprogramming
