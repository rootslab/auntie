>__MISSING__:
  
  - __#dist__:
    - [ ] re-implement the complex mode in a efficient way (memory/time/ops)
    - [ ] write (deep) tests for complex mode.
    - [x] implement the naive mode for #dist method (single byte sequence)
    - [x] fix naive mode relative benchmark.
    - [x] write tests for naive mode.
  
  
  - __#do__, __#count__:
    - [ ] write tests for the current implementation of the naive mode.

  - __#comb__
    - [ ] write simple tests, using "from" and "limit", also for naive mode.


>__TODO??__:

  - [ ] __Delayed Concatenation__. An example scenario: suppose that we have obtained
        no match for several chunks, the snip could also become very large. we could
        collect multiple buffers which don't contain the sequence, therefore delaying
        the data concatenation; however, for now, we concatenate only the previous
        chunk of data with the current one, the tonto way.
  
  - [ ] ..