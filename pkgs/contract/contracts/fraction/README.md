1. person -> BigBang call -> Hats.solに対してMintHatする
2. Hats.solからは発行したHatIdが返却される
3. TimeFrame.solに対して、HatId着用者のAddressを渡してタイムスタンプを登録
4. Splitterがタイムスタンプの取得や経過時間を取得できて重みづけができるようになる