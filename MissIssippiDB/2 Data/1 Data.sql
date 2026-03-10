insert Sizes(SizeName, SizeSequence)
        select '8', 1
union select '10', 2
union select '12', 3
union select 'XXS', 4
union select 'XS', 5
union select 'S', 6
union select 'M', 7
union select 'L', 8
union select 'XL', 9

insert ImageType([Type], Sequence)
      select 'Main', 1
union select 'Secondary', 2
union select 'Back', 3
union select 'Detail', 4
union select 'Group', 5

insert Season(SeasonName, SeasonDateCreated, Active)
 select 'SS26', GETDATE(), 1

 insert Collection(CollectionName)
select 'Casual'
union select 'Elegant'