>__MISSING__:
  
  - #dist:
    - [ ] re-implement the complex mode in a efficient way (memory/time/ops)
    - [ ] write (deep) tests for complex mode.
    - [x] implement the naive mode for #dist method (single byte sequence)
    - [x] fix naive mode relative benchmark.
    - [x] write tests for naive mode.
  
  
  - #do, #count:
    - [ ] write tests for the current implementation of the naive mode.

  - #comb
    - [ ] write simple test for "from" and "limit" when sequence is 1 byte long


>__TODO__:

  - [ ] Buffering. An example scenario: no match for several chunks, the snip will
    become very large. we could collect multiple buffers which don't contain
    the sequence, therefore delaying the data concatenation; however, for now,
    we concat only the previous chunk of data with the current, the tonto way.
  
  - [ ] ..